/**
 * 漢字データを Unicode Character Database から生成する
 *
 * - src/data/kanjiDataList.ts: Unihan データベースから生成する漢字データ
 * - src/data/compatibilityVariants.ts: StandardizedVariants.txt から生成する、SVS と CJK 互換漢字の対応表
 *
 * 使い方:
 *   npm run generate:data
 *     Unihan.zip と StandardizedVariants.txt をダウンロードして生成する
 *   npm run generate:data -- --zip ./Unihan.zip --svs ./StandardizedVariants.txt
 *     ダウンロード済みのファイルから生成する
 *
 * 使用する Unihan のフィールド（Unihan_OtherMappings.txt）:
 *   - kJoyoKanji:     常用漢字。本表の字は "2010"、許容字体は本表の字のコードポイント
 *   - kJinmeiyoKanji: 人名用漢字（戸籍法施行規則 別表第二）
 *   - kJis0:          JIS X 0208 の区点。16〜47区が第1水準、48〜84区が第2水準
 *   - kJIS0213:       JIS X 0213 で追加された字の面区点。1面が第3水準、2面が第4水準
 *
 * 使用する StandardizedVariants.txt の行:
 *   - 「<元の字> <異体字セレクタ>; CJK COMPATIBILITY IDEOGRAPH-<互換漢字>;」の行
 *     互換漢字と同じ字形を表す SVS の定義
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";

/** 使用する Unicode のバージョン。更新するときはここを変える */
const UNICODE_VERSION = "18.0.0";
const UCD_URL = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd`;
const UNIHAN_URL = `${UCD_URL}/Unihan.zip`;
const UNIHAN_FILE = "Unihan_OtherMappings.txt";
const SVS_URL = `${UCD_URL}/StandardizedVariants.txt`;
const SVS_FILE = "StandardizedVariants.txt";
const KANJI_DATA_PATH = join(__dirname, "../src/data/kanjiDataList.ts");
const COMPATIBILITY_VARIANTS_PATH = join(__dirname, "../src/data/compatibilityVariants.ts");

/** どの漢字セットにも含まれないが、常に許可する文字 */
const REQUIRED_CHARS = ["々", "〇"];

interface UnihanEntry {
  kJoyoKanji?: string;
  kJinmeiyoKanji?: string;
  kJis0?: string;
  kJIS0213?: string;
}

interface KanjiData {
  char: string;
  reg?: 1;
  name?: 1;
  jis1?: 1;
  jis2?: 1;
  jis3?: 1;
  rqd?: 1;
}

const TARGET_FIELDS = new Set<string>(["kJoyoKanji", "kJinmeiyoKanji", "kJis0", "kJIS0213"]);

/**
 * ファイルを読み込む。パスが指定されていなければダウンロードする
 */
async function loadFile(path: string | undefined, url: string): Promise<Uint8Array> {
  if (path) {
    return readFileSync(path);
  }
  console.log(`ダウンロード中: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} をダウンロードできませんでした: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function loadUnihanText(zipPath: string | undefined): Promise<string> {
  const zip = await loadFile(zipPath, UNIHAN_URL);
  const files = unzipSync(zip, { filter: (file) => file.name === UNIHAN_FILE });
  const file = files[UNIHAN_FILE];
  if (!file) {
    throw new Error(`Unihan.zip に ${UNIHAN_FILE} がありません`);
  }
  const text = strFromU8(file);

  // 指定したバージョンのファイルかを確認する
  if (!text.includes(`# Unicode Version ${UNICODE_VERSION}`)) {
    throw new Error(`${UNIHAN_FILE} が Unicode ${UNICODE_VERSION} のものではありません`);
  }
  return text;
}

async function loadStandardizedVariantsText(path: string | undefined): Promise<string> {
  const text = strFromU8(await loadFile(path, SVS_URL));

  // 指定したバージョンのファイルかを確認する
  if (!text.includes(`# ${SVS_FILE.replace(".txt", "")}-${UNICODE_VERSION}.txt`)) {
    throw new Error(`${SVS_FILE} が Unicode ${UNICODE_VERSION} のものではありません`);
  }
  return text;
}

/**
 * SVS と CJK 互換漢字の対応を取り出す
 *
 * @returns [SVS, 互換漢字] の配列
 */
function parseCompatibilityVariants(text: string): [string, string][] {
  const result: [string, string][] = [];
  const pattern = /^([0-9A-F]+) ([0-9A-F]+);\s*CJK COMPATIBILITY IDEOGRAPH-([0-9A-F]+);/;

  for (const line of text.split("\n")) {
    const match = line.match(pattern);
    if (!match) {
      continue;
    }
    const [, base, selector, compat] = match;
    const svs = String.fromCodePoint(parseInt(base, 16), parseInt(selector, 16));
    result.push([svs, String.fromCodePoint(parseInt(compat, 16))]);
  }

  return result;
}

function parseUnihan(text: string): Map<string, UnihanEntry> {
  const result = new Map<string, UnihanEntry>();

  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) {
      continue;
    }
    const [codePoint, field, value] = line.split("\t");
    if (!TARGET_FIELDS.has(field)) {
      continue;
    }
    const char = String.fromCodePoint(parseInt(codePoint.slice(2), 16));
    const entry = result.get(char) ?? {};
    entry[field as keyof UnihanEntry] = value;
    result.set(char, entry);
  }

  return result;
}

/**
 * 並び順のキー。必須の文字、JIS X 0208 の区点順、JIS X 0213 の面区点順の順に並べる
 */
function sortKey(char: string, entry: UnihanEntry | undefined): number {
  const requiredIndex = REQUIRED_CHARS.indexOf(char);
  if (requiredIndex > -1) {
    return requiredIndex;
  }
  if (entry?.kJis0) {
    return 1_000_000 + Number(entry.kJis0);
  }
  if (entry?.kJIS0213) {
    const [plane, row, cell] = entry.kJIS0213.split(",").map(Number);
    return 2_000_000 + plane * 10_000 + row * 100 + cell;
  }
  return 3_000_000 + (char.codePointAt(0) ?? 0);
}

function createKanjiDataList(unihan: Map<string, UnihanEntry>): KanjiData[] {
  const result: KanjiData[] = [];

  for (const char of REQUIRED_CHARS) {
    result.push({ char, rqd: 1 });
  }

  for (const [char, entry] of unihan) {
    const data: KanjiData = { char };

    if (entry.kJoyoKanji) {
      data.reg = 1;
    }
    if (entry.kJinmeiyoKanji) {
      data.name = 1;
    }
    if (entry.kJis0) {
      const row = Number(entry.kJis0.slice(0, 2));
      if (row >= 16 && row <= 47) {
        data.jis1 = 1;
      } else if (row >= 48 && row <= 84) {
        data.jis2 = 1;
      }
    }
    if (entry.kJIS0213?.startsWith("1,")) {
      data.jis3 = 1;
    }

    // 第1・第2水準の字と、常用漢字・人名用漢字だけを収録する
    // 第3水準は常用漢字・人名用漢字にあるものだけになる
    if (data.reg || data.name || data.jis1 || data.jis2) {
      result.push(data);
    }
  }

  return result.sort((a, b) => sortKey(a.char, unihan.get(a.char)) - sortKey(b.char, unihan.get(b.char)));
}

/** 見た目で区別できない文字を、コードポイントのエスケープで書く */
function escapeString(text: string): string {
  const escaped = [...text]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code > 0xffff
        ? `\\u{${code.toString(16).toUpperCase()}}`
        : `\\u${code.toString(16).toUpperCase().padStart(4, "0")}`;
    })
    .join("");
  return `"${escaped}"`;
}

function toCompatibilityVariantsSource(variants: [string, string][]): string {
  const lines = variants.map(([svs, compat]) => `  [${escapeString(svs)}, ${escapeString(compat)}], // ${compat}`);

  return `/**
 * SVS（標準化された異体字シーケンス）と CJK 互換漢字の対応表
 *
 * このファイルは scripts/generate-kanji-data.ts で生成しています。手で編集しないでください。
 * 出典: Unicode Character Database ${UNICODE_VERSION}（${SVS_FILE}）
 *
 * 互換漢字と、それと同じ字形を表す SVS を同じ字として扱うために使う。
 * 各要素は [SVS, 互換漢字]。
 */
export const compatibilityVariants: ReadonlyArray<readonly [string, string]> = [
${lines.join("\n")}
];
`;
}

function toSource(list: KanjiData[]): string {
  const keys = ["reg", "name", "jis1", "jis2", "jis3", "rqd"] as const;
  const lines = list.map((data) => {
    const props = [`char: ${JSON.stringify(data.char)}`, ...keys.filter((key) => data[key]).map((key) => `${key}: 1`)];
    return `  { ${props.join(", ")} },`;
  });

  return `/**
 * 漢字データ
 *
 * このファイルは scripts/generate-kanji-data.ts で生成しています。手で編集しないでください。
 * 出典: Unicode Unihan Database ${UNICODE_VERSION}（${UNIHAN_FILE}）
 *
 * \`char\`以外は該当のものに含まれるかどうか。含まれない場合はキー自体が存在しない。
 *
 * @property {string} char キャラクター
 * @property {1} [reg] 常用漢字（常用漢字表の本表の字と許容字体。kJoyoKanji）
 * @property {1} [name] 人名用漢字（戸籍法施行規則 別表第二。kJinmeiyoKanji）
 * @property {1} [jis1] JIS第1水準（kJis0 の16〜47区）
 * @property {1} [jis2] JIS第2水準（kJis0 の48〜84区）
 * @property {1} [jis3] JIS第3水準（kJIS0213 の1面）。常用漢字か人名用漢字にあるものだけ収録
 * @property {1} [rqd] 以上のどのセットにも当てはまらないが、\\p{Script=Han}に含まれており、よく使われる文字。必ず許可される。
 */
export interface KanjiData {
  char: string;
  reg?: 1;
  name?: 1;
  jis1?: 1;
  jis2?: 1;
  jis3?: 1;
  rqd?: 1;
}

export type KanjiDataList = KanjiData[];

export const kanjiDataList: KanjiDataList = new Array<KanjiData>(
${lines.join("\n")}
);
`;
}

async function main() {
  const getOption = (name: string): string | undefined => {
    const index = process.argv.indexOf(name);
    return index > -1 ? process.argv[index + 1] : undefined;
  };

  const unihan = parseUnihan(await loadUnihanText(getOption("--zip")));
  const list = createKanjiDataList(unihan);
  writeFileSync(KANJI_DATA_PATH, toSource(list));

  const variants = parseCompatibilityVariants(await loadStandardizedVariantsText(getOption("--svs")));
  writeFileSync(COMPATIBILITY_VARIANTS_PATH, toCompatibilityVariantsSource(variants));

  const count = (key: keyof KanjiData) => list.filter((data) => data[key]).length;
  console.log(`生成しました: ${KANJI_DATA_PATH}`);
  console.log(
    `全${list.length}字（常用 ${count("reg")}、人名用 ${count("name")}、第1水準 ${count("jis1")}、第2水準 ${count("jis2")}、第3水準 ${count("jis3")}）`,
  );
  console.log(`生成しました: ${COMPATIBILITY_VARIANTS_PATH}（${variants.length}件）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
