import { segmentKanji } from "./grapheme";
import type { KanjiList } from "./kanjiList";

/**
 * 文字列または文字列の配列を漢字の配列に変換する
 *
 * - 書記素（見た目の1文字）単位で分割する。異体字セレクタ付きの漢字は、セレクタを含めて1文字として扱う
 * - 漢字の判定は{@link https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BHan%7D|UnicodeセットのScript=Han}で行う
 * @param {string | string[]} texts
 * @returns {KanjiList}
 */
export function convertTextToKanjiArray(texts: string | string[]): KanjiList {
  const result: KanjiList = [];
  const inputArray: string[] = Array.isArray(texts) ? texts : [texts];

  for (const item of inputArray) {
    for (const { char } of segmentKanji(item)) {
      result.push(char);
    }
  }

  // 重複除去
  const optimized = new Set(result);

  return [...optimized];
}
