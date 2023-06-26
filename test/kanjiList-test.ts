import * as assert from "assert";
import {
  createKanjiPreset,
  createPresetTargets,
  FORENAME,
  FORENAME_OPTION_KEY,
  getAllowedKanjiList,
  JIS1,
  JIS2,
  REGULAR_OPTION_KEY,
  REQUIRED,
} from "../src/utils/kanjiList";
import { REGULAR } from "../src/utils/kanjiList";
import type { KanjiDataList } from "../src/data/kanjiDataList";
import type { KanjiKey, KanjiList } from "../src/utils/kanjiList";

describe("createPresetTargets", () => {
  it("正常にプリセットターゲットを作成できること", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: true,
      [FORENAME_OPTION_KEY]: false,
      [JIS1]: true,
      [JIS2]: false,
    };

    const expected = [REQUIRED, REGULAR, JIS1] as KanjiKey[];

    const result = createPresetTargets(presetTargets);
    assert.deepStrictEqual(result, expected);
  });

  it("プリセットターゲットが指定されていない場合、REQUIREDと常用漢字が含まれること", () => {
    const presetTargets = {};

    const expected = [REQUIRED, REGULAR] as KanjiKey[];

    const result = createPresetTargets(presetTargets);
    assert.deepStrictEqual(result, expected);
  });

  it("すべてのプリセットターゲットが有効な場合、すべてのキーが含まれること", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: true,
      [FORENAME_OPTION_KEY]: true,
      [JIS1]: true,
      [JIS2]: true,
    };

    const expected = [REQUIRED, REGULAR, FORENAME, JIS1, JIS2] as KanjiKey[];

    const result = createPresetTargets(presetTargets);
    assert.deepStrictEqual(result, expected);
  });

  it("プリセットターゲットが偽の場合、REQUIREDのみが含まれること", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: false,
      [FORENAME_OPTION_KEY]: false,
      [JIS1]: false,
      [JIS2]: false,
    };

    const expected = [REQUIRED] as KanjiKey[];

    const result = createPresetTargets(presetTargets);
    assert.deepStrictEqual(result, expected);
  });
});

describe("createKanjiPreset", () => {
  const kanjiDataList = [
    { char: "々", rqd: 1 },
    { char: "亜", reg: 1, name: 1, jis1: 1 },
    { char: "宍", jis1: 1 },
    { char: "弌", jis2: 1 },
    { char: "丼", reg: 1, name: 1, jis2: 1 },
    { char: "逸", reg: 1, name: 1, jis3: 1 },
    { char: "俠", name: 1, jis3: 1 },
  ] as KanjiDataList;

  it("正常にプリセット漢字セットが作成されること：常用漢字", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: true,
    };

    const expected = ["々", "亜", "丼", "逸"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("正常にプリセット漢字セットが作成されること：人名用漢字", () => {
    const presetTargets = {
      [FORENAME_OPTION_KEY]: true,
    };

    const expected = ["々", "亜", "丼", "逸", "俠"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("正常にプリセット漢字セットが作成されること：JIS第一水準漢字", () => {
    const presetTargets = {
      [JIS1]: true,
    };

    const expected = ["々", "亜", "宍"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("正常にプリセット漢字セットが作成されること：JIS第二水準漢字", () => {
    const presetTargets = {
      [JIS2]: true,
    };

    const expected = ["々", "弌", "丼"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("正常にプリセット漢字セットが作成されること：ミックス", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: true,
      [FORENAME_OPTION_KEY]: false,
      [JIS1]: true,
      [JIS2]: false,
    };

    const expected = ["々", "亜", "宍", "丼", "逸"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("プリセット漢字セットが指定されていない場合、必須漢字と常用漢字の配列が返されること", () => {
    const presetTargets = {};

    const expected = ["々", "亜", "丼", "逸"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("すべてのプリセット漢字セットが有効な場合、すべての漢字が含まれること", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: true,
      [FORENAME_OPTION_KEY]: true,
      [JIS1]: true,
      [JIS2]: true,
    };

    const expected = ["々", "亜", "宍", "弌", "丼", "逸", "俠"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });

  it("プリセット漢字セットが無効の場合、必須漢字のみの配列が返されること", () => {
    const presetTargets = {
      [REGULAR_OPTION_KEY]: false,
      [FORENAME_OPTION_KEY]: false,
      [JIS1]: false,
      [JIS2]: false,
    };

    const expected = ["々"] as KanjiList;

    const result = createKanjiPreset(presetTargets, kanjiDataList);
    assert.deepStrictEqual(result, expected);
  });
});

describe("getAllowedKanjiList", () => {
  const preset = ["亜", "異", "宇", "絵", "王"];

  it("ユーザー定義がない場合、プリセットがそのまま返されること", () => {
    const userExclude = "";
    const userAllow = "";

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, preset);
  });

  it("excludeの文字列にある漢字が除外されること", () => {
    const userExclude = "異王";
    const userAllow = "";

    const expected = ["亜", "宇", "絵"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });

  it("excludeの配列にある漢字が除外されること", () => {
    const userExclude = ["異王", "絵"];
    const userAllow = [] as string[];

    const expected = ["亜", "宇"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });

  it("allowの文字列にある漢字が追加されること", () => {
    const userExclude = "";
    const userAllow = "可気苦毛子";

    const expected = ["亜", "異", "宇", "絵", "王", "可", "気", "苦", "毛", "子"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });

  it("allowの配列にある漢字が追加されること", () => {
    const userExclude = [] as string[];
    const userAllow = ["可気", "苦毛", "子"];

    const expected = ["亜", "異", "宇", "絵", "王", "可", "気", "苦", "毛", "子"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });

  it("allowの漢字が重複する場合、重複が除去されること", () => {
    const userExclude = "";
    const userAllow = ["可", "可能"];

    const expected = ["亜", "異", "宇", "絵", "王", "可", "能"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });

  it("excludeとallowで漢字が重複する場合、allowが優先されること", () => {
    const userExclude = "亜異王";
    const userAllow = ["異能", "亜"];

    const expected = ["宇", "絵", "異", "能", "亜"];

    const result = getAllowedKanjiList(preset, userExclude, userAllow);
    assert.deepStrictEqual(result, expected);
  });
});
