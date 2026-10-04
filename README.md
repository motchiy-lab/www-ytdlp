## コマンド

```sh
npm install
npm run dev
npm run build
npm run preview
```

既存サイトのフロントエンドはAstroで静的生成し、`/ip` ページと `/ip.json` エンドポイントはCloudflare上でリクエストごとにレンダリングします。ダウンロード要求は `https://api.motchiy.com/ytdlp/request` に `videoUrl`、`fileFormat`、`platform` をJSONでPOSTします。POSTの `task_id` を受け取り、1秒間隔で `GET https://api.motchiy.com/ytdlp/tasks/{task_id}` を呼び出して状態を確認します。APIの状態レスポンスは `status` と `message` を返し、`completed` ではHTTPSの `download_url` にブラウザーを移動し、`failed` ではエラーを表示します。

公開用ファイルは `dist/` に生成されます。既存の `.html` URLを維持するためAstroをfile形式で出力する設定にしています。CSS、画像、共有用スクリプトは `public/` から配信します。ブラウザーから別オリジンのAPIに接続するため、API側でサイトオリジンのCORSとJSONのPOST/OPTIONSを許可してください。
