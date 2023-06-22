import { matchPatterns } from "@textlint/regexp-string-matcher";
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

  // 許可する漢字パターンを作成
  const allowedKanjiPattern = getAllowedKanjiPatterns(options.allowPatterns ?? [], allowedKanji);

  return {
    [Syntax.Str](node) {
      const text = getSource(node);
      // テキスト内の漢字
      const matches = text.matchAll(/\p{Script=Han}/gu);

      // 漢字ごとに出現したインデックス+文字の長さを記録して、次の同じ漢字のパターンチェック用文字列作成に使う
      const nextStartStartIndexes: { [key: string]: number } = {};

      for (const match of matches) {
        const char = match[0];

        if (allowedKanji.includes(char)) {
          // 許可されている漢字はパターンチェックも必要ないのでスキップして次へ
          continue;
        }

        const index = match.index ?? 0;

        // 許可する漢字の配列になかったらとりあえずエラーメッセージを作っておく
        // パターンチェックでOKの場合はcontinueするので使われない
        let message = `「${char}」は許可されていない漢字です。`;

        // 許可する漢字パターンにあるかチェック
        // あった場合は処理にインデックスを使うので、findIndexで探す
        const allowedKanjiPatterCharIndex = allowedKanjiPattern.findIndex(({ kanji }) => kanji === char);

        if (allowedKanjiPatterCharIndex > -1) {
          const nextIndex = text.indexOf(char, index + char.length);
          const searchEndIndex = nextIndex > -1 ? nextIndex : text.length;
          const searchStartIndex = nextStartStartIndexes[char] ?? 0;
          // 検索範囲を切り出す
          // この範囲内でパターンチェックを行う
          // 例（カギ括弧内が検索範囲）:
          //   赤白赤白赤から1番目の赤が対象の場合: 「赤白」赤白赤
          //   赤白赤白赤から2番目の赤が対象の場合: 赤「白赤白」赤
          //   赤白赤白赤から3番目の赤が対象の場合: 赤白赤「白赤」
          const searchTarget = text.slice(searchStartIndex, searchEndIndex);
          const patterns = allowedKanjiPattern[allowedKanjiPatterCharIndex].patterns;
          const patternMatches = matchPatterns(searchTarget, patterns);
          // パターンがマッチしてもしなくても次の検索スタート位置を更新
          nextStartStartIndexes[char] = index + char.length;

          if (!patternMatches.length) {
            // パターンがマッチしなかった場合はエラーメッセージを更新
            // マッチしなかったというのは
            // 「該当漢字を対象とした許可パターン自体は存在しているが、パターンにマッチしなかった」
            // という意味なので次のようなメッセージになる
            message = `「${char}」は "${patterns.join(`" "`)}" 以外のパターンでは許可されていない漢字です。`;
          } else {
            // マッチした、つまりパターンに該当する場合は問題ないということなのでエラーをレポートせずに次にいく
            continue;
          }
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
