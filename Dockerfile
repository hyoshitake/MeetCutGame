FROM node:22-alpine

WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 開発依存関係をインストール
RUN npm install

# 本番環境用のビルド
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=0 /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 開発環境用
FROM node:22-alpine AS development
WORKDIR /app

# ホットリロード用の環境変数を設定
ENV NODE_ENV=development

# コンテナ起動時にnpm run devを実行
CMD ["npm", "run", "dev"]

# ポート3000を公開
EXPOSE 3000
