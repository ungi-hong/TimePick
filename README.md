# TimePick

面談スケジューリングカレンダーアプリ。Google Calendar の予定を取り込みつつ、稼働可能時間から候補時間を生成して相手に提示する個人用 Web アプリ。

## 技術スタック

- Next.js 16 (App Router) + TypeScript
- Auth.js v5 + Google Provider
- Neon Postgres + Prisma 7
- Tailwind CSS v4 + shadcn/ui
- date-fns / date-fns-tz / @holiday-jp/holiday_jp
- TanStack Query / react-hook-form + zod / sonner

## 初回セットアップ

### 1. 依存をインストール

```powershell
pnpm install
```

### 2. Neon Postgres を作成

1. https://console.neon.tech にサインアップ
2. 新規 Project を作成 (Region: `ap-southeast-1` 等)
3. 接続文字列 (Connection String) をコピー
4. `.env.example` を `.env.local` にコピーし、`DATABASE_URL` に貼り付ける

### 3. Google OAuth クライアントを作成

1. https://console.cloud.google.com で新規プロジェクト作成
2. 「APIs & Services」→「Library」で **Google Calendar API** を有効化
3. 「OAuth consent screen」を構成 (User type: External、テストユーザーに自分の Google アカウントを追加)
4. 「Credentials」→「Create credentials」→「OAuth client ID」→ Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-vercel-domain>/api/auth/callback/google` (本番デプロイ後に追加)
5. Client ID / Client Secret を `.env.local` の `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` にコピー
6. OAuth 同意画面のスコープ設定 (Scopes for Google APIs):
   - `openid email profile` (初回ログイン)
   - `https://www.googleapis.com/auth/calendar.events` (Calendar 連携時に追加要求)
   - `https://www.googleapis.com/auth/calendar.readonly` (Calendar 連携時に追加要求)
7. OAuth 同意画面の「Test users」に自分と知人の Google アカウントを登録

### 4. AUTH_SECRET を生成

```powershell
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

生成された文字列を `.env.local` の `AUTH_SECRET` に貼り付け。

### 5. DB マイグレーション

```powershell
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

### 6. 開発サーバー起動

```powershell
pnpm dev
```

http://localhost:3000 を開く。

## デプロイ (Vercel)

1. GitHub にリポジトリを push
2. https://vercel.com で「Add New Project」→ GitHub 連携 → このリポジトリを選択
3. Environment Variables に `.env.local` の全項目を登録
   - `NEXTAUTH_URL` は Vercel が割り当てた本番 URL に変更
4. Deploy

## 開発フロー

- `pnpm dev` — Next.js 開発サーバー (Turbopack)
- `pnpm build` — 本番ビルド
- `pnpm lint` — ESLint
- `pnpm exec prisma studio` — DB の GUI

## ライセンス

個人プロジェクト。
