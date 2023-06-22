import type { KanjiList } from "./kanjiList";

/**
 * 文字列または文字列の配列を漢字の配列に変換する
 *
 * - 漢字の判定は{@link https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BHan%7D|UnicodeセットのScript=Han}で行う
 * @param {string | string[]} texts
 * @returns {KanjiList}
 */
export function convertTextToKanjiArray(texts: string | string[]): KanjiList {
  const result: KanjiList = [];
  const inputArray: string[] = Array.isArray(texts) ? texts : [texts];
  const segmenter = new Intl.Segmenter("ja-JP");

  for (const item of inputArray) {
    const segmentList = segmenter.segment(item);
    for (const { segment } of segmentList) {
      // 漢字のみ抽出
      if (/\p{Script=Han}/u.test(segment)) {
        result.push(segment);
      }
    }
  }

  // 重複除去
  const optimized = new Set(result);

  return [...optimized];
}
