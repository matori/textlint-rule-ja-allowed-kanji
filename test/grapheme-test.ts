import * as assert from "assert";
import { normalizeCompatibilityVariant, removeVariationSelectors, segmentKanji } from "../src/utils/grapheme";

// 葛 + IVS（U+E0100）
const KATSU_IVS = "葛\u{E0100}";
// 海 + SVS（U+FE00）。互換漢字の海（U+FA45）と同じ字形
const UMI_SVS = "海︀";
const UMI_COMPAT = "海";

describe("segmentKanji", () => {
  it("漢字だけを位置と一緒に取り出すこと", () => {
    const result = segmentKanji("今日は良い天気");

    assert.deepStrictEqual(result, [
      { char: "今", segment: "今", index: 0 },
      { char: "日", segment: "日", index: 1 },
      { char: "良", segment: "良", index: 3 },
      { char: "天", segment: "天", index: 5 },
      { char: "気", segment: "気", index: 6 },
    ]);
  });

  it("サロゲートペアの漢字を1文字として扱うこと", () => {
    const result = segmentKanji("𩸽と𠮟");

    assert.deepStrictEqual(result, [
      { char: "𩸽", segment: "𩸽", index: 0 },
      { char: "𠮟", segment: "𠮟", index: 3 },
    ]);
  });

  it("異体字セレクタ付きの漢字を、セレクタを含めて1文字として扱うこと", () => {
    const result = segmentKanji(`${KATSU_IVS}飾`);

    assert.deepStrictEqual(result, [
      { char: KATSU_IVS, segment: KATSU_IVS, index: 0 },
      { char: "飾", segment: "飾", index: 3 },
    ]);
  });

  it("互換漢字と同じ字形のSVSは、判定に使う字を互換漢字に置き換えること", () => {
    const result = segmentKanji(`${UMI_SVS}と${UMI_COMPAT}`);

    assert.deepStrictEqual(result, [
      { char: UMI_COMPAT, segment: UMI_SVS, index: 0 },
      { char: UMI_COMPAT, segment: UMI_COMPAT, index: 3 },
    ]);
  });

  it("漢字を含まない入力では空の配列を返すこと", () => {
    assert.deepStrictEqual(segmentKanji("Hello, ひらがな"), []);
  });
});

describe("removeVariationSelectors", () => {
  it("IVSを取り除くこと", () => {
    assert.strictEqual(removeVariationSelectors(KATSU_IVS), "葛");
  });

  it("SVSを取り除くこと", () => {
    assert.strictEqual(removeVariationSelectors(UMI_SVS), "海");
  });

  it("異体字セレクタが付いていない場合はそのまま返すこと", () => {
    assert.strictEqual(removeVariationSelectors("葛"), "葛");
    assert.strictEqual(removeVariationSelectors("𩸽"), "𩸽");
  });
});

describe("normalizeCompatibilityVariant", () => {
  it("互換漢字と同じ字形のSVSを互換漢字に置き換えること", () => {
    assert.strictEqual(normalizeCompatibilityVariant(UMI_SVS), UMI_COMPAT);
    // 神 + U+FE00 → 互換漢字の神（U+FA19）
    assert.strictEqual(normalizeCompatibilityVariant("神︀"), "神");
  });

  it("該当しない文字はそのまま返すこと", () => {
    assert.strictEqual(normalizeCompatibilityVariant("海"), "海");
    assert.strictEqual(normalizeCompatibilityVariant(UMI_COMPAT), UMI_COMPAT);
    assert.strictEqual(normalizeCompatibilityVariant(KATSU_IVS), KATSU_IVS);
  });
});
