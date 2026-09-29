## コマンド

```sh
npm install
npm run dev
npm run build
npm run preview
```

既存サイトのフロントエンドをAstroで静的生成します。ダウンロード要求は `http://localhost:8080/ytdlp/request` にJSONでPOSTします。`userIp` は開発環境用に `127.0.0.1` を送信します。

公開用ファイルは `dist/` に生成されます。既存の `.html` URLを維持するためAstroをfile形式で出力する設定にしています。CSS、画像、共有用スクリプトは `public/` から配信します。ブラウザーから別オリジンのAPIに接続するため、API側でサイトオリジンのCORSとJSONのPOST/OPTIONSを許可してください。本番サイトからの `localhost` は訪問者自身の端末を指すため、API URLは本番環境用に変更が必要です。
