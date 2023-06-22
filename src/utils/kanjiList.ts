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

export function createPresetTargets(presetTargets: OptionPreset): KanjiKey[] {
  const targets = Object.entries(presetTargets) as [keyof OptionPreset, boolean][];
  const result: KanjiKey[] = [REQUIRED];

  if (!targets.length) {
    result.push(REGULAR);
  } else {
    for (const [key, value] of targets) {
      if (!value) {
        continue;
      }
      switch (key) {
        case REGULAR_OPTION_KEY:
          result.push(REGULAR);
          break;
        case FORENAME_OPTION_KEY:
          result.push(FORENAME);
          break;
        default:
          result.push(key as KanjiKey);
      }
    }
  }

  return result;
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
