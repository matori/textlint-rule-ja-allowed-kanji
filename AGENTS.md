# AGENTS.md

許可された漢字だけが使われているかをチェックする textlint ルールです。
オプションや使い方は [README.md](README.md) を参照してください。

## コマンド

```sh
npm ci                # 依存パッケージのインストール
npm run build         # src/ を lib/ にビルド（tsc）
npm test              # テスト（mocha + tsx）
npm run format        # 整形（prettier）
npm run format:check  # 整形のチェック（CI で実行）
```

- Node.js 22 以上が必要です。
- 作業を終える前に `npm run format:check`、`npm run build`、`npm test` がすべて通ることを確認してください。

## 構成

| パス | 役割 |
|---|---|
| `src/index.ts` | ルール本体。オプションの型定義と、本文の漢字を検査する処理 |
| `src/utils/kanjiList.ts` | プリセットと `exclude` / `allowKanji` から、許可する漢字の一覧を作る |
| `src/utils/kanjiPattern.ts` | `allowPatterns` を漢字ごとのパターン一覧にまとめる |
| `src/utils/convertTextToKanjiArray.ts` | オプションの文字列から漢字を取り出す |
| `src/utils/grapheme.ts` | テキストを書記素単位に分割して漢字を取り出す、異体字セレクタを取り除く |
| `src/data/kanjiDataList.ts` | 漢字データ。各漢字が常用漢字・人名用漢字・JIS 水準のどれに含まれるかのフラグを持つ |
| `test/rule-test.ts` | ルール全体のテスト（textlint-tester） |
| `test/*-test.ts` | `src/utils/` の各関数の単体テスト |
| `lib/` | ビルド結果（git 管理外） |

## 約束事

- コミットメッセージは日本語で書きます。
- バグ修正や仕様変更では、その内容を確かめるテストを一緒に追加します。
- ルール全体の動作は `test/rule-test.ts` に、関数単位の動作は対応する単体テストに書きます。
- オプションや動作を変えたときは README も更新します。

## 仕様上の約束事

- 漢字は書記素（見た目の1文字）単位で扱います。本文の走査もオプションの解釈も `src/utils/grapheme.ts` の `segmentKanji` を使い、コードポイント単位の正規表現（`/\p{Script=Han}/gu` など）で本文を走査しません。
- 異体字セレクタ（IVS・SVS）付きの字は、その字自体が許可されていなければ、元の字が許可されているかで判定します。ただし、その字自体が `exclude` にある場合は許可しません。別の文字コードが割り当てられた異体字（「辺・邊・邉」など）は元の字に戻して判定しません。

- `preset` オプションのキーは大文字・小文字を区別しません。有効なキー（`regular` / `forename` / `jis1` / `jis2`）以外が含まれていたら、値に関係なくエラーにします。
