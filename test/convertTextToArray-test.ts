import * as assert from "assert";
import { convertTextToKanjiArray } from "../src/utils/convertTextToKanjiArray";
import type { KanjiList } from "../src/utils/kanjiList";

describe("convertTextToKanjiArray", () => {
  it("文字列を漢字の配列に変換すること", () => {
    const text = "今日は良い天気ですね";

    const expected = ["今", "日", "良", "天", "気"] as KanjiList;

    const result = convertTextToKanjiArray(text);
    assert.deepStrictEqual(result, expected);
  });

  it("文字列の配列を漢字の配列に変換すること", () => {
    const texts = ["今日", "明日", "明後日"];

    const expected = ["今", "日", "明", "後"] as KanjiList;

    const result = convertTextToKanjiArray(texts);
    assert.deepStrictEqual(result, expected);
  });

  it("空の入力に対応すること", () => {
    const text = "";

    const expected = [] as KanjiList;

    const result = convertTextToKanjiArray(text);
    assert.deepStrictEqual(result, expected);
  });

  it("空の配列の入力に対応すること", () => {
    const texts: string[] = [];

    const expected = [] as KanjiList;

    const result = convertTextToKanjiArray(texts);
    assert.deepStrictEqual(result, expected);
  });

  it("漢字を含まない入力に対応すること", () => {
    const text = "Hello, world!";

    const expected = [] as KanjiList;

    const result = convertTextToKanjiArray(text);
    assert.deepStrictEqual(result, expected);
  });

  it("空白を含む複数の文字種が混在する入力に対応すること", () => {
    const text = "abc\b123\nあいうえお\tアイウエオ　ｱｲｳｴｵ\n１２３\n漢字\n「」（）【】、。！？";

    const expected = ["漢", "字"] as KanjiList;
    const result = convertTextToKanjiArray(text);
    assert.deepStrictEqual(result, expected);
  });
});
