# ベースイメージとしてnode:22を使用
FROM node:22-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードをコピー
COPY . .

# ビルド処理を実行
RUN npm run build

# アプリケーションを起動するポートを公開
EXPOSE 3000

# 起動コマンド
CMD ["npm", "start"]
