import TextLintTester from "textlint-tester";
import rule from "../src";

const tester = new TextLintTester();

// 葛 + IVS（U+E0100、U+E0101）
const KATSU_0 = "葛\u{E0100}";
const KATSU_1 = "葛\u{E0101}";
// 海 + SVS（U+FE00）
const UMI_SVS = "海\uFE00";

tester.run("[textlint rule] textlint-rule-ja-allowed-kanji", rule, {
  valid: [
    {
      text: "オプションなし：今日は良い天気ですね。",
      options: {},
    },
    {
      text: "常用漢字：今日は良い天気ですね。",
      options: {
        preset: {
          regular: true,
        },
      },
    },
    {
      text: "人名用漢字：今年は丑年です。",
      options: {
        preset: {
          forename: true,
        },
      },
    },
    {
      text: "常用漢字（本表の字体と許容字体）：シールを剝がす。シールを剥がす。",
      options: {},
    },
    {
      text: "人名用漢字（常用漢字も含む）：亞希子さんは今年、丑年です。",
      options: {
        preset: {
          regular: false,
          forename: true,
        },
      },
    },
    {
      text: "JIS1漢字：この旅行で宍道湖を訪れました。",
      options: {
        preset: {
          jis1: true,
        },
      },
    },
    {
      text: "JIS1+JIS2漢字：「弌」という字は「一」の古字です。",
      options: {
        preset: {
          jis1: true,
          jis2: true,
        },
      },
    },
    {
      text: "プリセットのキーの大文字・小文字：「弌」という字は「一」の古字です。",
      options: {
        preset: {
          JIS1: true,
          Jis2: true,
        },
      },
    },
    {
      text: "許可（文字列）：その野菜炒めは罠です。",
      options: {
        allowKanji: "炒罠",
      },
    },
    {
      text: "許可（漢字以外を含む文字列）：その野菜炒めは罠です。",
      options: {
        allowKanji: "　炒 \n 罠\t",
      },
    },
    {
      text: "許可（1文字ずつの配列）：その野菜炒めは罠です。",
      options: {
        allowKanji: ["炒", "罠"],
      },
    },
    {
      text: "許可（複数文字の配列）：その野菜炒めは罠です。",
      options: {
        allowKanji: ["炒罠"],
      },
    },
    {
      text: "除外+許可：川が氾濫しています。",
      options: {
        exclude: "濫",
        allowKanji: "濫",
      },
    },
    {
      text: "除外+許可パターン（文字列）：川が氾濫しています。",
      options: {
        exclude: "濫",
        allowPatterns: ["氾濫"],
      },
    },
    {
      text: "同じ漢字を繰り返す許可パターン：呶呶する。",
      options: {
        allowPatterns: ["呶呶"],
      },
    },
    {
      text: `異体字（元の字がプリセットで許可）：${KATSU_0}飾区`,
      options: {},
    },
    {
      text: `異体字（SVS、元の字がプリセットで許可）：${UMI_SVS}`,
      options: {},
    },
    {
      text: `異体字（異体字だけを許可）：${KATSU_0}飾区`,
      options: {
        exclude: "葛",
        allowKanji: KATSU_0,
      },
    },
    {
      text: `異体字（特定の異体字だけを除外）：葛飾区と${KATSU_0}飾区`,
      options: {
        exclude: KATSU_1,
      },
    },
    {
      text: `異体字（許可パターン）：${KATSU_0}飾区`,
      options: {
        exclude: "葛",
        allowPatterns: [`${KATSU_0}飾`],
      },
    },
    {
      text: "許可パターン（正規表現文字列）：今日のおかずは野菜炒めです。",
      options: {
        allowPatterns: ["/炒(?=め)/"],
      },
    },
  ],
  invalid: [
    {
      text: `常用漢字表の括弧内の旧字体：
學校`,
      errors: [
        {
          message: `「學」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 2,
            },
          },
        },
      ],
    },
    {
      text: `名前に使えない旧字体：
學`,
      options: {
        preset: {
          forename: true,
        },
      },
      errors: [
        {
          message: `「學」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 2,
            },
          },
        },
      ],
    },
    {
      text: `エラー漢字：

今日のおかずは野菜炒めです。`,
      errors: [
        {
          message: `「炒」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 3,
              column: 10,
            },
            end: {
              line: 3,
              column: 11,
            },
          },
        },
      ],
    },
    {
      text: `同じエラーが出る複数の漢字：

今日は丑年の丑の日です。`,
      errors: [
        {
          message: `「丑」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 3,
              column: 4,
            },
            end: {
              line: 3,
              column: 5,
            },
          },
        },
        {
          message: `「丑」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 3,
              column: 7,
            },
            end: {
              line: 3,
              column: 8,
            },
          },
        },
      ],
    },
    {
      text: `除外によるエラー：
今日は良い天気ですね。`,
      options: {
        exclude: "良",
      },
      errors: [
        {
          message: `「良」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 4,
            },
            end: {
              line: 2,
              column: 5,
            },
          },
        },
      ],
    },
    {
      text: `正規表現文字列パターンに当てはまらないエラー：

今日のおかずは野菜炒めです。炒飯つき。`,
      options: {
        allowPatterns: ["/炒(?=め)/"],
      },
      errors: [
        {
          message: `「炒」は "/炒(?=め)/" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 3,
              column: 15,
            },
            end: {
              line: 3,
              column: 16,
            },
          },
        },
      ],
    },
    {
      text: `文字列パターンに当てはまらないエラー：
銑鉄、銑銭、製銑`,
      options: {
        allowKanji: "銭",
        allowPatterns: ["銑鉄", "製銑"],
      },
      errors: [
        {
          message: `「銑」は "銑鉄" "製銑" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 4,
            },
            end: {
              line: 2,
              column: 5,
            },
          },
        },
      ],
    },
    {
      text: `同じ漢字を繰り返す許可パターンのエラー：
呶呶呶`,
      options: {
        allowPatterns: ["呶呶"],
      },
      errors: [
        {
          message: `「呶」は "呶呶" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 3,
            },
            end: {
              line: 2,
              column: 4,
            },
          },
        },
      ],
    },
    {
      text: `後読みの許可パターンのエラー：
呶呶`,
      options: {
        allowPatterns: ["/(?<=呶)呶/"],
      },
      errors: [
        {
          message: `「呶」は "/(?<=呶)呶/" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 2,
            },
          },
        },
      ],
    },
    {
      text: `元の字を除外すると異体字もエラー：
${KATSU_0}飾区`,
      options: {
        exclude: "葛",
      },
      errors: [
        {
          message: `「${KATSU_0}」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 4,
            },
          },
        },
      ],
    },
    {
      text: `異体字だけを許可した場合の元の字と別の異体字のエラー：
葛飾区と${KATSU_1}飾区`,
      options: {
        exclude: "葛",
        allowKanji: KATSU_0,
      },
      errors: [
        {
          message: `「葛」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 2,
            },
          },
        },
        {
          message: `「${KATSU_1}」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 5,
            },
            end: {
              line: 2,
              column: 8,
            },
          },
        },
      ],
    },
    {
      text: `特定の異体字だけを除外した場合のエラー：
${KATSU_1}飾区`,
      options: {
        exclude: KATSU_1,
      },
      errors: [
        {
          message: `「${KATSU_1}」は許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 4,
            },
          },
        },
      ],
    },
    {
      text: `異体字の許可パターンのエラー：
${KATSU_0}城`,
      options: {
        exclude: "葛",
        allowPatterns: [`${KATSU_0}飾`],
      },
      errors: [
        {
          message: `「${KATSU_0}」は "${KATSU_0}飾" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 4,
            },
          },
        },
      ],
    },
    {
      text: `サロゲートペアを含む許可パターンのエラー：
𩸽の干物、縞𩸽、縞々焼𩸽`,
      options: {
        allowPatterns: ["縞𩸽"],
      },
      errors: [
        {
          message: `「𩸽」は "縞𩸽" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 1,
            },
            end: {
              line: 2,
              column: 3,
            },
          },
        },
        {
          message: `「縞」は "縞𩸽" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 11,
            },
            end: {
              line: 2,
              column: 12,
            },
          },
        },
        {
          message: `「𩸽」は "縞𩸽" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 14,
            },
            end: {
              line: 2,
              column: 16,
            },
          },
        },
      ],
    },
    {
      text: `README掲載の例：
職権濫用の諜報から得た情報です。
川が氾濫したそうですが、今日のおかずは野菜炒めです。炒飯もあります。

豆を炒るのは明日です。
`,
      options: {
        exclude: "濫",
        allowKanji: "諜",
        allowPatterns: ["氾濫", "/炒(?=め)/"],
      },
      errors: [
        {
          message: `「濫」は "氾濫" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 2,
              column: 3,
            },
            end: {
              line: 2,
              column: 4,
            },
          },
        },
        {
          message: `「炒」は "/炒(?=め)/" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 3,
              column: 27,
            },
            end: {
              line: 3,
              column: 28,
            },
          },
        },
        {
          message: `「炒」は "/炒(?=め)/" 以外のパターンでは許可されていない漢字です。`,
          loc: {
            start: {
              line: 5,
              column: 3,
            },
            end: {
              line: 5,
              column: 4,
            },
          },
        },
      ],
    },
  ],
});
