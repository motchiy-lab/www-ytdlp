# yt-dlp on Motchiy

既存サイトのフロントエンドをAstroで静的生成します。元のPHPファイルは `www-ytdlp-old-main` に残してあり、URL送信とサーバー側のダウンロード処理は移行対象外です。

## コマンド

```sh
npm install
npm run dev
npm run build
npm run preview
```

公開用ファイルは `dist/` に生成されます。既存の `.html` URLを維持するためAstroをfile形式で出力する設定にしています。CSS、画像、既存のクライアントスクリプトは `public/` から配信します。ダウンロード機能を利用するには、既存の `download.php` を同一ホストで引き続き稼働させる必要があります（PHPファイルは静的出力には含まれません）。
