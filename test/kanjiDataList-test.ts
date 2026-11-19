import * as assert from "assert";
import { kanjiDataList } from "../src/data/kanjiDataList";
import type { KanjiData } from "../src/data/kanjiDataList";

const find = (char: string): KanjiData | undefined => kanjiDataList.find((data) => data.char === char);
const count = (key: keyof KanjiData): number => kanjiDataList.filter((data) => data[key]).length;

describe("kanjiDataList", () => {
  it("同じ文字が重複していないこと", () => {
    const chars = kanjiDataList.map(({ char }) => char);
    assert.strictEqual(new Set(chars).size, chars.length);
  });

  it("各漢字セットの字数が出典どおりであること", () => {
    // 常用漢字: 本表の2,136字と許容字体4字
    assert.strictEqual(count("reg"), 2136 + 4);
    // 人名用漢字: 戸籍法施行規則 別表第二
    assert.strictEqual(count("name"), 864);
    assert.strictEqual(count("jis1"), 2965);
    assert.strictEqual(count("jis2"), 3390);
  });

  describe("常用漢字", () => {
    it("本表の字体が含まれること", () => {
      for (const char of ["剝", "塡", "頰", "𠮟"]) {
        assert.strictEqual(find(char)?.reg, 1, char);
      }
    });

    it("許容字体が含まれること", () => {
      for (const char of ["剥", "填", "頬", "叱"]) {
        assert.strictEqual(find(char)?.reg, 1, char);
      }
    });

    it("常用漢字表の括弧内の旧字体が含まれないこと", () => {
      for (const char of ["學", "亞", "舊", "辨", "瓣", "辯", "艷"]) {
        assert.strictEqual(find(char)?.reg, undefined, char);
      }
    });
  });

  describe("人名用漢字", () => {
    it("常用漢字を含まないこと", () => {
      for (const char of ["亜", "学", "旧"]) {
        assert.strictEqual(find(char)?.name, undefined, char);
      }
    });

    it("別表第二の字が含まれること", () => {
      // 丑: 別表第二の一、亞: 別表第二の二（常用漢字の異体字）
      for (const char of ["丑", "亞"]) {
        assert.strictEqual(find(char)?.name, 1, char);
      }
    });

    it("名前に使えない旧字体が含まれないこと", () => {
      for (const char of ["學", "舊", "辨"]) {
        assert.strictEqual(find(char)?.name, undefined, char);
      }
    });
  });
});
