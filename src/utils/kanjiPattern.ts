import { convertTextToKanjiArray } from "./convertTextToKanjiArray";
import type { OptionPattern } from "../index";
import type { KanjiList } from "./kanjiList";

/**
 * 特定パターンの漢字を許可するデータ
 *
 * @property {string} kanji 対象の漢字
 * @property {string[]} patterns 許可するパターンの文字列の配列
 */
export interface KanjiPattern {
  kanji: string;
  patterns: string[];
}
export type KanjiPatternList = KanjiPattern[];

/**
 * 許可パターンを作成する
 *
 * @param {OptionPattern} userDefined ユーザー定義の許可パターン
 * @param {KanjiList} allowedKanji 許可された漢字の配列
 * @return {KanjiPatternList}
 */
export function getAllowedKanjiPatterns(userDefined: OptionPattern, allowedKanji: KanjiList): KanjiPatternList {
  const result = [] as KanjiPatternList;

  for (const pattern of userDefined) {
    const kanjiList = convertTextToKanjiArray(pattern);

    for (const char of kanjiList) {
      if (allowedKanji.includes(char)) {
        // 許可された漢字のパターンを追加する必要はないのでスキップして次へ
        continue;
      }

      // result内に対象漢字のパターンが存在しているか
      const existPattern = result.find(({ kanji }) => kanji === char);

      if (existPattern) {
        // 既に対象漢字のパターンに存在する漢字ならパターンだけ追加する
        existPattern.patterns.push(pattern);
        continue;
      }

      // 漢字とパターンを追加
      const patternData: KanjiPattern = { kanji: char, patterns: [pattern] };
      result.push(patternData);
    }
  }

  return result;
}
