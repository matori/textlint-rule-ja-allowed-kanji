import { matchPatterns } from "@textlint/regexp-string-matcher";
import type { matchPatternResult } from "@textlint/regexp-string-matcher";
import { kanjiDataList } from "./data/kanjiDataList";
import {
  createKanjiPreset,
  getAllowedKanjiList,
  REGULAR_OPTION_KEY,
  FORENAME_OPTION_KEY,
  JIS1,
  JIS2,
} from "./utils/kanjiList";
import { getAllowedKanjiPatterns } from "./utils/kanjiPattern";
import { convertTextToKanjiArray } from "./utils/convertTextToKanjiArray";
import { removeVariationSelectors, segmentKanji } from "./utils/grapheme";
import type { TextlintRuleModule } from "@textlint/types";

/**
 * @property {boolean} regular 常用漢字
 * @property {boolean} forename 人名用漢字
 * @property {boolean} jis1 JIS第1水準漢字
 * @property {boolean} jis2 JIS第2水準漢字
 */
export interface OptionPreset {
  [REGULAR_OPTION_KEY]?: boolean;
  [FORENAME_OPTION_KEY]?: boolean;
  [JIS1]?: boolean;
  [JIS2]?: boolean;
}
export type OptionKanji = string | string[];
export type OptionPattern = string[];

/**
 * @property {OptionPreset} preset プリセット指定
 * @property {OptionKanji} exclude プリセットから除外する漢字
 * @property {OptionKanji} allowKanji プリセット以外で許可する漢字
 * @property {OptionPattern} allowPatterns プリセット以外で許可するパターン
 */
export interface Options {
  preset?: OptionPreset;
  exclude?: OptionKanji;
  allowKanji?: OptionKanji;
  allowPatterns?: OptionPattern;
}

const report: TextlintRuleModule<Options> = (context, options = {}) => {
  const { Syntax, RuleError, report, getSource, locator } = context;

  // プリセットが指定されていなければ常用漢字のみを許可する
  const presetTargets = options.preset ?? { [REGULAR_OPTION_KEY]: true };
  // 許可する漢字の配列を作成
  const kanjiPreset = createKanjiPreset(presetTargets, kanjiDataList);
  const allowedKanji = getAllowedKanjiList(kanjiPreset, options.exclude ?? [], options.allowKanji ?? []);
  // 本文の漢字1文字ごとに検索するので、Setにしておく
  const allowedKanjiSet = new Set(allowedKanji);
  // 除外する漢字（異体字セレクタ付きの字を個別に除外する判定で使う）
  const excludedKanjiSet = new Set(convertTextToKanjiArray(options.exclude ?? []));

  /**
   * 漢字が許可されているかを判定する
   *
   * - 許可する漢字の配列にそのままあれば許可する
   * - 異体字セレクタ付きの字は、その字自体が除外されていなければ、元の字が許可されているかで判定する
   *
   * @param {string} char 書記素単位の漢字
   * @returns {boolean}
   */
  const isAllowedKanji = (char: string): boolean => {
    if (allowedKanjiSet.has(char)) {
      return true;
    }
    const baseChar = removeVariationSelectors(char);
    if (baseChar === char || excludedKanjiSet.has(char)) {
      return false;
    }
    return allowedKanjiSet.has(baseChar);
  };

  // 許可する漢字パターンを作成
  const allowedKanjiPattern = getAllowedKanjiPatterns(options.allowPatterns ?? [], allowedKanji);
  // 漢字から許可パターンを引けるようにしておく
  const allowedKanjiPatternMap = new Map(allowedKanjiPattern.map(({ kanji, patterns }) => [kanji, patterns]));

  return {
    [Syntax.Str](node) {
      const text = getSource(node);
      // テキスト内の漢字（書記素単位）
      const kanjiSegments = segmentKanji(text);

      // 漢字ごとの許可パターンのマッチ結果
      // 同じ漢字が何度出てきても、テキスト全体に対する照合は1回で済むようにキャッシュする
      const patternMatchesCache = new Map<string, matchPatternResult[]>();

      for (const { char, index } of kanjiSegments) {
        if (isAllowedKanji(char)) {
          // 許可されている漢字はパターンチェックも必要ないのでスキップして次へ
          continue;
        }

        // 許可する漢字の配列になかったらとりあえずエラーメッセージを作っておく
        // パターンチェックでOKの場合はcontinueするので使われない
        let message = `「${char}」は許可されていない漢字です。`;

        // 許可する漢字パターンにあるかチェック
        const patterns = allowedKanjiPatternMap.get(char);

        if (patterns) {
          let patternMatches = patternMatchesCache.get(char);
          if (!patternMatches) {
            // テキスト全体に対して照合する
            // 照合範囲を切り詰めると、前の文脈を見るパターンや、同じ漢字を繰り返すパターンがマッチしなくなる
            patternMatches = matchPatterns(text, patterns);
            patternMatchesCache.set(char, patternMatches);
          }

          // マッチした範囲が対象の漢字の位置を含んでいれば許可する
          const charEndIndex = index + char.length;
          const isAllowed = patternMatches.some(
            ({ startIndex, endIndex }) => startIndex <= index && charEndIndex <= endIndex,
          );

          if (isAllowed) {
            continue;
          }

          // 「該当漢字を対象とした許可パターン自体は存在しているが、パターンにマッチしなかった」
          // という意味なので次のようなメッセージになる
          message = `「${char}」は "${patterns.join(`" "`)}" 以外のパターンでは許可されていない漢字です。`;
        }
        // エラーレポート
        const padding = locator.range([index, index + char.length]);
        const ruleError = new RuleError(message, { padding });
        report(node, ruleError);
      }
    },
  };
};

export default report;
