# textlint-rule-ja-allowed-kanji

textlint rule that allows only specified kanji characters for Japanese.

許可された漢字のみを使用するように指摘する[textlint](https://github.com/textlint/textlint)用ルールです。

Refs：
- [文化庁 | 国語施策・日本語教育 | 国語施策情報 | 内閣告示・内閣訓令 | 常用漢字表（平成22年内閣告示第2号）](https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/)
- [法務省：子の名に使える漢字](https://www.moj.go.jp/MINJI/minji86.html)
- [日本産業標準調査会：データベース-JIS規格詳細画面 JIS X0213](https://www.jisc.go.jp/app/jis/general/GnrJISNumberNameSearchList?toGnrJISStandardDetailList)

漢字として判定される文字については以下のリンクを参照してください。

[Unicode Utilities: UnicodeSet - Han](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=\p{Han})

## Install

Install with [npm](https://www.npmjs.com/):

Required: Node.js >= 16.0

```sh
npm install textlint-rule-ja-allowed-kanji
```

## Usage

Via `.textlintrc.json`(Recommended)

```json
{
  "rules": {
    "ja-allowed-kanji": true
  }
}
```

Via CLI

```
textlint --rule ja-allowed-kanji README.md
```

## Options

```ts
{
    /**
     * どの漢字セットを使用するかのオプションです。
     * オプションが指定されていない場合は常用漢字のみになります。
     *
     * 人名用漢字は常用漢字を含むので、
     * 常用漢字と人名用漢字を許可する場合は`forename`を`true`にするだけでOKです。
     *
     * すべて`false`にすると「々」「〇」のみ許可されるプリセットが作成されます。
     *
     * - regular: 常用漢字
     * - forename: 人名用漢字
     * - jis1: JIS第1水準（JIS X0213）
     * - jis2: JIS第2水準（JIS X0213）
     */
    preset? : {
        regular? : boolean;
        forename? : boolean;
        jis1? : boolean;
        jis2? : boolean;
    }
    /**
     * プリセットから漢字を除外するオプションです。
     * 文字列、または文字列の配列で指定します。
     *
     * - 文字列中に改行や空白があっても問題ありません。
     * - 配列の要素は1文字だけでなくても構いません。
     */
    exclude? : string | string[];
    /**
     * プリセットに存在しない漢字を許可するオプションです。
     * 文字列、または文字列の配列で指定します。
     *
     * - 文字列中に改行や空白があっても問題ありません。
     * - 配列の要素は1文字だけでなくても構いません。
     */
    allowKanji? : string | string[];
    /**
     * プリセットに存在しない漢字を特定パターンのみ許可するオプションです。
     * 文字列の配列で指定します。
     * 
     * 正規表現を文字列として指定できます。
     * 例："/炒(?=め)/"
     */
    allowPatterns? : string[];
}
```

### ※ 踊り字、漢数字のゼロ、二の字点、同上記号


踊り字「々」と漢数字の「〇」はどの漢字セットにも含まれませんが、自動的にプリセットに追加されます。  
不要な場合は`exclude`オプションで除外してください。

二の字点「〻」と同上記号「仝」はプリセットに含まれません。  
必要に応じて`allowKanji`オプションで許可してください。

### 許可する漢字を完全にコントールしたい場合

- プリセットオプション内をすべて`false`にする
- `exclude`オプションで`"々〇"`を指定する
- `allowKanji`オプションに使いたい漢字を設定

### Options Example

たとえば、NHKの [新用字用語辞典の概要まとまる（1）[PDF]](https://www.nhk.or.jp/bunken/summary/research/report/2010_08/100807.pdf) を参考に、「濫」を「氾濫」のみに限定し、「諜」を許可したいとします。  
また、「炒」を「炒め」の場合のみ許可したいとします。「炒る」「炒飯」などは不許可です。

```json
{
  "rules": {
    "ja-allowed-kanji": {
      // 常用漢字のみを使うのでpresetは指定しなくてもいい
      "exclude": "濫",
      "allowKanji": "諜",
      "allowPatterns": [
        "氾濫",
        "/炒(?=め)/"
      ]
    }
  }
}
```

この場合、次のテキストはいくつかのエラーが出力されます。

```text
職権濫用の諜報から得た情報です。
川が氾濫したそうですが、今日のおかずは野菜炒めです。炒飯もあります。

豆を炒るのは明日です。
```

エラーの内容：

```text
1:3   error  「濫」は "氾濫" 以外のパターンでは許可されていない漢字です。        ja-allowed-kanji
2:27  error  「炒」は "/炒(?=め)/" 以外のパターンでは許可されていない漢字です。  ja-allowed-kanji
4:3   error  「炒」は "/炒(?=め)/" 以外のパターンでは許可されていない漢字です。  ja-allowed-kanji
```

## Build

Builds source codes for publish to the `lib` folder.

```sh
npm run build
```

## Tests

Run test code in `test` folder.
Test textlint rule by [textlint-tester](https://github.com/textlint/textlint-tester).

```shell
npm test
```

## License

MIT © matori

## Related rules

- [kongou-ae/textlint-rule-joyo-kanji: 常用漢字を使っているかチェックするtextlintルール](https://github.com/kongou-ae/textlint-rule-joyo-kanji)
- [textlint-ja/textlint-rule-ja-joyo-or-jinmeiyo-kanji: 常用漢字または人名用漢字であることをチェックするtextlintルール](https://github.com/textlint-ja/textlint-rule-ja-joyo-or-jinmeiyo-kanji)
- [textlint-ja/textlint-rule-ja-kyoiku-kanji: 教育漢字であることをチェックするtextlintルール](https://github.com/textlint-ja/textlint-rule-ja-kyoiku-kanji)
- [lostandfound/textlint-rule-jis-charset: Report if character out of JIS X 0213:2004 is found.](https://github.com/lostandfound/textlint-rule-jis-charset)
