/**
 * テキスト中の漢字1文字分の情報
 *
 * @property {string} char 漢字（書記素単位。異体字セレクタが付いている場合はそれも含む）
 * @property {number} index テキスト中の位置（UTF-16 のインデックス）
 */
export interface KanjiSegment {
  char: string;
  index: number;
}

const segmenter = new Intl.Segmenter("ja-JP", { granularity: "grapheme" });

/**
 * 異体字セレクタ
 *
 * - U+FE00〜U+FE0F: 標準化された異体字シーケンス（SVS）などで使われる
 * - U+E0100〜U+E01EF: 漢字の異体字シーケンス（IVS）で使われる
 */
const VARIATION_SELECTOR_PATTERN = /[︀-️\u{E0100}-\u{E01EF}]/gu;

/**
 * テキストを書記素（見た目の1文字）単位に分割し、漢字だけを取り出す
 *
 * - 漢字の判定は{@link https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BHan%7D|UnicodeセットのScript=Han}で行う
 * - 異体字セレクタ付きの漢字は、セレクタを含めて1文字として扱う
 *
 * @param {string} text
 * @returns {KanjiSegment[]}
 */
export function segmentKanji(text: string): KanjiSegment[] {
  const result: KanjiSegment[] = [];

  for (const { segment, index } of segmenter.segment(text)) {
    if (/\p{Script=Han}/u.test(segment)) {
      result.push({ char: segment, index });
    }
  }

  return result;
}

/**
 * 異体字セレクタを取り除いた元の字を返す
 *
 * 異体字セレクタが付いていない場合は、そのまま返す
 *
 * @param {string} char
 * @returns {string}
 */
export function removeVariationSelectors(char: string): string {
  return char.replace(VARIATION_SELECTOR_PATTERN, "");
}
