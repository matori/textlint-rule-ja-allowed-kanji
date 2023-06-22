import * as assert from "assert";
import { getAllowedKanjiPatterns } from "../src/utils/kanjiPattern";
import type { OptionPattern } from "../src";
import type { KanjiPatternList } from "../src/utils/kanjiPattern";

describe("getAllowedKanjiPatterns", () => {
  const allowedKanji = ["亜", "異", "宇", "絵", "王"];

  it("許可パターンが空の場合、空のリストが返されること", () => {
    const userDefined: OptionPattern = [];

    const expected = [] as KanjiPatternList;

    const result = getAllowedKanjiPatterns(userDefined, allowedKanji);
    assert.deepStrictEqual(result, expected);
  });

  it("許可パターンに許可された漢字が含まれている場合、その漢字はスキップされること", () => {
    const userDefined: OptionPattern = ["異王", "海王"];

    const expected = [{ kanji: "海", patterns: ["海王"] }] as KanjiPatternList;

    const result = getAllowedKanjiPatterns(userDefined, allowedKanji);
    assert.deepStrictEqual(result, expected);
  });

  it("許可パターンに対応する漢字が存在しない場合、新しい許可パターンが作成されること", () => {
    const userDefined: OptionPattern = ["可能", "気"];

    const expected = [
      { kanji: "可", patterns: ["可能"] },
      { kanji: "能", patterns: ["可能"] },
      { kanji: "気", patterns: ["気"] },
    ] as KanjiPatternList;

    const result = getAllowedKanjiPatterns(userDefined, allowedKanji);
    assert.deepStrictEqual(result, expected);
  });

  it("許可パターンに対応する漢字が既に存在する場合、既存の許可パターンに追加されること", () => {
    const userDefined: OptionPattern = ["可能", "不可"];

    const expected = [
      { kanji: "可", patterns: ["可能", "不可"] },
      { kanji: "能", patterns: ["可能"] },
      { kanji: "不", patterns: ["不可"] },
    ] as KanjiPatternList;

    const result = getAllowedKanjiPatterns(userDefined, allowedKanji);
    assert.deepStrictEqual(result, expected);
  });
});
