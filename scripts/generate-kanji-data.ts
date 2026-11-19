/**
 * 漢字データ（src/data/kanjiDataList.ts）を Unicode の Unihan データベースから生成する
 *
 * 使い方:
 *   npm run generate:data                       # Unihan.zip をダウンロードして生成する
 *   npm run generate:data -- --zip ./Unihan.zip # ダウンロード済みの Unihan.zip から生成する
 *
 * 使用する Unihan のフィールド（Unihan_OtherMappings.txt）:
 *   - kJoyoKanji:     常用漢字。本表の字は "2010"、許容字体は本表の字のコードポイント
 *   - kJinmeiyoKanji: 人名用漢字（戸籍法施行規則 別表第二）
 *   - kJis0:          JIS X 0208 の区点。16〜47区が第1水準、48〜84区が第2水準
 *   - kJIS0213:       JIS X 0213 で追加された字の面区点。1面が第3水準、2面が第4水準
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";

/** 使用する Unicode のバージョン。更新するときはここを変える */
const UNICODE_VERSION = "18.0.0";
const UNIHAN_URL = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/Unihan.zip`;
const UNIHAN_FILE = "Unihan_OtherMappings.txt";
const OUTPUT_PATH = join(__dirname, "../src/data/kanjiDataList.ts");

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

async function loadUnihanText(zipPath: string | undefined): Promise<string> {
  let zip: Uint8Array;
  if (zipPath) {
    zip = readFileSync(zipPath);
  } else {
    console.log(`ダウンロード中: ${UNIHAN_URL}`);
    const response = await fetch(UNIHAN_URL);
    if (!response.ok) {
      throw new Error(`Unihan.zip をダウンロードできませんでした: ${response.status} ${response.statusText}`);
    }
    zip = new Uint8Array(await response.arrayBuffer());
  }

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
  const zipIndex = process.argv.indexOf("--zip");
  const zipPath = zipIndex > -1 ? process.argv[zipIndex + 1] : undefined;

  const unihan = parseUnihan(await loadUnihanText(zipPath));
  const list = createKanjiDataList(unihan);
  writeFileSync(OUTPUT_PATH, toSource(list));

  const count = (key: keyof KanjiData) => list.filter((data) => data[key]).length;
  console.log(`生成しました: ${OUTPUT_PATH}`);
  console.log(
    `全${list.length}字（常用 ${count("reg")}、人名用 ${count("name")}、第1水準 ${count("jis1")}、第2水準 ${count("jis2")}、第3水準 ${count("jis3")}）`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
