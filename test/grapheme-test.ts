import * as assert from "assert";
import { removeVariationSelectors, segmentKanji } from "../src/utils/grapheme";

// 葛 + IVS（U+E0100）
const KATSU_IVS = "葛\u{E0100}";
// 海 + SVS（U+FE00）
const UMI_SVS = "海︀";

describe("segmentKanji", () => {
  it("漢字だけを位置と一緒に取り出すこと", () => {
    const result = segmentKanji("今日は良い天気");

    assert.deepStrictEqual(result, [
      { char: "今", index: 0 },
      { char: "日", index: 1 },
      { char: "良", index: 3 },
      { char: "天", index: 5 },
      { char: "気", index: 6 },
    ]);
  });

  it("サロゲートペアの漢字を1文字として扱うこと", () => {
    const result = segmentKanji("𩸽と𠮟");

    assert.deepStrictEqual(result, [
      { char: "𩸽", index: 0 },
      { char: "𠮟", index: 3 },
    ]);
  });

  it("異体字セレクタ付きの漢字を、セレクタを含めて1文字として扱うこと", () => {
    const result = segmentKanji(`${KATSU_IVS}飾と${UMI_SVS}`);

    assert.deepStrictEqual(result, [
      { char: KATSU_IVS, index: 0 },
      { char: "飾", index: 3 },
      { char: UMI_SVS, index: 5 },
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
