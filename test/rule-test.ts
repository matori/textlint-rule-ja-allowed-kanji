import TextLintTester from "textlint-tester";
import rule from "../src";

const tester = new TextLintTester();

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
      text: "許可パターン（正規表現文字列）：今日のおかずは野菜炒めです。",
      options: {
        allowPatterns: ["/炒(?=め)/"],
      },
    },
  ],
  invalid: [
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
        allowPatterns: [
          "氾濫",
          "/炒(?=め)/"
        ]
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
