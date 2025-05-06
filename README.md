# 牛肉ぴったんこチャレンジ

牛肉をぴったり半分に切るゲームです。シンプルな操作で楽しめる、反射神経と感覚を競うミニゲームです。

## 機能

- Supabase認証によるユーザー登録・ログイン機能
- 牛肉を半分に切るゲームプレイ
- スコアの記録と保存
- 上位プレイヤーのランキング表示

## 技術スタック

- Next.js 14
- TypeScript
- Supabase (認証・データベース)
- TailwindCSS
- Docker

## 開発環境のセットアップ

### 前提条件

- Node.js 22以上
- npm または yarn
- Supabaseアカウント

### インストール手順

1. リポジトリをクローンする
```bash
git clone <リポジトリURL>
cd MeetCutGame
```

2. 依存関係をインストールする
```bash
npm install
# または
yarn install
```

3. Supabaseプロジェクトを作成
   - [Supabase](https://supabase.com/)でアカウントを作成し、新しいプロジェクトを作成
   - 以下のテーブルを作成:
     - profiles (id, username, updated_at)
     - scores (id, user_id, score, created_at)

4. 環境変数の設定
   - `.env.local.example`ファイルを`.env.local`にコピー
   - Supabaseのプロジェクト設定からURLとAnon Keyを取得し、`.env.local`に設定

5. 開発サーバーを起動
```bash
npm run dev
# または
yarn dev
```

6. ブラウザで[http://localhost:3000](http://localhost:3000)にアクセス

## Dockerでの実行

```bash
# イメージをビルド
docker build -t beef-cut-game .

# コンテナを実行
docker run -p 3000:3000 beef-cut-game
```

## ライセンス

MITライセンス
