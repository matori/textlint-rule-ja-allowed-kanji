import { convertTextToKanjiArray } from "./convertTextToKanjiArray";
import type { OptionPreset, OptionKanji } from "../index";
import type { KanjiDataList } from "../data/kanjiDataList";

export const REGULAR = "reg";
export const REGULAR_OPTION_KEY = "regular";
export const FORENAME = "name";
export const FORENAME_OPTION_KEY = "forename";
export const JIS1 = "jis1";
export const JIS2 = "jis2";
export const REQUIRED = "rqd";

export type KanjiKey = typeof REGULAR | typeof FORENAME | typeof JIS1 | typeof JIS2 | typeof REQUIRED;
export type KanjiList = string[];

/**
 * presetオプションのキー（小文字）と漢字データのキーの対応
 */
const PRESET_KEY_MAP = new Map<string, KanjiKey>([
  [REGULAR_OPTION_KEY, REGULAR],
  [FORENAME_OPTION_KEY, FORENAME],
  [JIS1, JIS1],
  [JIS2, JIS2],
]);

/**
 * presetオプションから、プリセット作成の対象となる漢字データのキーを作成する
 *
 * - キーの大文字・小文字は区別しない
 * - 未知のキーが含まれている場合はエラーを投げる
 *
 * @param {OptionPreset} presetTargets presetオプション
 * @returns {KanjiKey[]} 漢字データのキーの配列
 */
export function createPresetTargets(presetTargets: OptionPreset): KanjiKey[] {
  const targets = Object.entries(presetTargets) as [string, boolean | undefined][];
  const result = new Set<KanjiKey>([REQUIRED]);

  if (!targets.length) {
    result.add(REGULAR);
    return [...result];
  }

  for (const [key, value] of targets) {
    const kanjiKey = PRESET_KEY_MAP.get(key.toLowerCase());

    if (!kanjiKey) {
      const validKeys = [...PRESET_KEY_MAP.keys()].join(", ");
      throw new Error(`presetオプションに未知のキー "${key}" が指定されています。有効なキー: ${validKeys}`);
    }

    if (value) {
      result.add(kanjiKey);
    }
  }

  return [...result];
}

/**
 * プリセット指定に応じた漢字セットを漢字データから作成する
 *
 * @param {OptionPreset} presetTargets プリセット作成の対象となる漢字セットのフラグ
 * @param {KanjiDataList} kanjiDataList プリセット作成の元となるデータ
 * @returns {KanjiList} 漢字の配列
 */
export function createKanjiPreset(presetTargets: OptionPreset, kanjiDataList: KanjiDataList): KanjiList {
  const targetKeys = createPresetTargets(presetTargets);
  const result: KanjiList = [];

  for (const kanji of kanjiDataList) {
    const keys = Object.keys(kanji) as KanjiKey[];
    if (keys.some((key) => targetKeys.includes(key))) {
      result.push(kanji.char);
    }
  }

  return result;
}

/**
 * プリセット指定とユーザー定義から許可する漢字の配列を作成する
 *
 * - userDisallowとuserAllowに同じ漢字が指定されている場合はallowとして扱う
 *
 * @param {KanjiList} preset 作成した漢字セット
 * @param {OptionKanji} userExclude プリセットから除外する漢字
 * @param {OptionKanji} userAllow プリセットにないが、許可する漢字
 */
export function getAllowedKanjiList(preset: KanjiList, userExclude: OptionKanji, userAllow: OptionKanji): KanjiList {
  if (!userExclude.length && !userAllow.length) {
    return preset;
  }
  const disallow = convertTextToKanjiArray(userExclude);
  const allow = convertTextToKanjiArray(userAllow);

  // allow優先なので、最初にdisallowを除外してからallowを追加する
  const filtered = preset.filter((char) => !disallow.includes(char));

  // 重複除去
  const result = new Set([...filtered, ...allow]);

  return [...result] as KanjiList;
}
