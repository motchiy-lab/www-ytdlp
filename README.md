## コマンド

```sh
npm install
npm run dev
npm run build
npm run preview
```

既存サイトのフロントエンドはAstroで静的生成し、`/ip` ページと `/ip.json` エンドポイントはCloudflare上でリクエストごとにレンダリングします。ダウンロード時には `/ip.json` からアクセス元IPを取得して、ダウンロード要求の `userIp` に設定します。ダウンロード要求は `http://localhost:8080/ytdlp/request` にJSONでPOSTします。POSTの `task_id` を受け取り、1秒間隔で `GET /ytdlp/tasks/{task_id}` を呼び出して完了状態を確認します。

公開用ファイルは `dist/` に生成されます。既存の `.html` URLを維持するためAstroをfile形式で出力する設定にしています。CSS、画像、共有用スクリプトは `public/` から配信します。ブラウザーから別オリジンのAPIに接続するため、API側でサイトオリジンのCORSとJSONのPOST/OPTIONSを許可してください。本番サイトからの `localhost` は訪問者自身の端末を指すため、API URLは本番環境用に変更が必要です。
