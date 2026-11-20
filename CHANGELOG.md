# Changelog

## 2.0.0

### 破壊的変更

- Node.js 22 以上が必要になりました（v1 は 16 以上）。（[#2](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/2)）
- `preset` オプションに未知のキーを指定するとエラーになるようになりました。キーの大文字・小文字は区別しません（`Regular`、`JIS1` なども有効です）。（[#5](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/5)）
- 漢字データを Unicode の Unihan データベース（Unicode 18.0.0）から生成するようにし、各漢字セットの範囲を出典どおりにしました。（[#6](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/6)、[#7](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/7)、[#12](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/12)）
  - `regular`（常用漢字）から、常用漢字表の括弧内に添えられた旧字体（「學」「亞」など364字）を外しました。
  - `regular` に、常用漢字表の本表の字体「剝」「塡」「頰」「𠮟」を追加しました（許容字体の「剥」「填」「頬」「叱」も引き続き許可されます）。
  - `forename`（人名用漢字）を戸籍法施行規則 別表第二どおりにし、名前に使えない旧字体（「學」「舊」「辨」など160字）を外しました。「勒」を追加しました。`forename` を指定すると常用漢字も許可される点は変わりません。
- 漢字を書記素（見た目の1文字）単位で扱うようにしました。異体字セレクタ付きの字は、セレクタを含めて1文字として扱います。エラーの位置とメッセージも、セレクタを含めたものになります。（[#4](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/4)）
  - 元の字が許可されていれば、その IVS 付きの字も許可されます。IVS 付きの字だけを `allowKanji` で許可した場合、元の字は許可されません。
  - `exclude` で元の字を除外すると、その IVS 付きの字も除外されます。IVS 付きの字を指定すると、その字だけが除外されます。
- CJK 互換漢字（「神」U+FA19 など）と、それと同じ字形を表す SVS（「神」+ U+FE00 など）を同じ字として扱い、元の字には戻さないようにしました。v1 では許可されていた SVS 付きの旧字体（「海」+ U+FE00 など）は、`regular` ではエラーになります。（[#8](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/8)）

### バグ修正

- `allowPatterns` で、同じ漢字を繰り返すパターン（`"呶呶"` など）や、前の文脈を見るパターン（`"/(?<=呶)呶/"` など）が正しく許可されない問題を修正しました。（[#3](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/3)）
- `allowKanji` に異体字セレクタ付きの字を指定しても、本文のその字が許可されない問題を修正しました。（[#4](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/4)）

### 改善

- 許可する漢字の判定を高速化しました。10万字の文章で約6倍速くなります。（[#9](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/9)）

### その他

- 依存パッケージを更新しました（TypeScript 7、textlint 16 系の型定義とテストツールなど）。（[#2](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/2)）
- 漢字データを生成するスクリプト（`npm run generate:data`）を追加しました。（[#12](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/12)）
- AI エージェント向けの指示ファイル（`AGENTS.md`、`CLAUDE.md`）を追加しました。（[#11](https://github.com/matori/textlint-rule-ja-allowed-kanji/issues/11)）
