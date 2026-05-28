# TimePick

面談・打ち合わせ用の **候補日程生成 ⇄ Google Calendar 同期 ⇄ 確定** を一気通貫で扱う 1 人用カレンダーアプリ。

「次の 2 週間で空いている時間を 5 つ提案 → コピペで相手に送る → 返ってきた希望時刻で確定 → Google Calendar に書き込み」までを最短手数でやることを目的に作っている。

## このリポジトリについて

### 主な機能

- **稼働時間 / 例外日設定**: 曜日ごとの稼働時間、祝日扱い、日付単位の例外を登録できる。
- **候補生成**: 稼働時間から既存予定 (Google Calendar busy / 他の OPEN 候補 / 確定済み面談) と被らない空き時間レンジを抽出。最小レンジ・前後バッファを指定可能。
- **Google Calendar 同期**: 各候補を `[候補] <ラベル>` イベントとして Calendar に書き込み (`transparency: transparent` で空き枠は残す)。
- **コピペ用テキスト**: 「12月3日(火) 10:00 〜 11:00 または 14:00 〜 15:00」のような送付用フォーマットを生成。
- **確定フロー**: 候補レンジ内で 30 分 / 60 分のスロットを選んで確定 → Meeting レコード作成 → Google Calendar に通常イベントとして書き込み → 候補イベントは自動削除。
- **複数ビュー**: 月 / 週 / 日 / スケジュール。詳細表示は PC ではポップアップ、モバイルでは全画面シート。
- **Stale 候補通知**: 7 日以上更新されていない OPEN 候補を上部バナーで通知。「無視」(タッチ更新) / 「削除」可。

### 技術スタック

| 層 | 技術 |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Style | Tailwind CSS v4 + shadcn/ui (`@base-ui/react` ベース) |
| 認証 | Auth.js v5 (`next-auth`) + Prisma Adapter + Google OAuth |
| DB | Prisma 7 + `@prisma/adapter-neon` + `@neondatabase/serverless` |
| データ層 | TanStack Query v5 |
| 時刻 | date-fns + date-fns-tz (JST 基準で統一) + `@holiday-jp/holiday_jp` |
| API | googleapis (Google Calendar v3) |
| Validation | Zod |
| Toast | Sonner |
| Test | Vitest + Testing Library (`TZ=UTC` で実行) |

### デプロイ環境

| レイヤー | サービス |
|---|---|
| Hosting | Vercel |
| DB | Neon (serverless PostgreSQL) — `production` / `dev` ブランチで分離 |
| Auth | Google OAuth (Auth.js v5) |
| Calendar | Google Calendar API |

---

## 環境構築

### 前提

- Node.js 20+
- pnpm 9+
- Neon アカウント
- Google Cloud Console プロジェクト

### 1. 依存インストール

```powershell
pnpm install
```

`postinstall` で `prisma generate` が走り、`src/generated/prisma/` に Prisma Client が出力される (このパスは `prisma/schema.prisma` で指定)。

### 2. Neon プロジェクト準備

1. https://neon.tech でプロジェクト作成 (Default branch: `production`)
2. 開発用に `dev` ブランチを作成
   - Parent branch: `production`
   - Auto-delete: **Never**
   - Branch data and schema: 選択 (production の現データをコピー)
3. `dev` ブランチの **direct connection** 文字列をコピー

### 3. Google OAuth 準備

1. https://console.cloud.google.com で OAuth 2.0 クライアント ID を作成 (タイプ: ウェブアプリケーション)
2. **承認済みの JavaScript 生成元**: `http://localhost:3000`
3. **承認済みのリダイレクト URI**: `http://localhost:3000/api/auth/callback/google`
4. **APIs & Services > ライブラリ** で **Google Calendar API** を Enable
5. クライアント ID / シークレットを控える
6. **OAuth 同意画面** を設定 (External + テストユーザーに自分のメール追加)

### 4. `.env.local` 作成

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon `dev` ブランチの direct URL |
| `AUTH_SECRET` | `[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))` で生成 |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_GOOGLE_ID` | Google OAuth クライアント ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth シークレット |
| `ALLOWED_EMAILS` | 自分の Google メール (カンマ区切り複数可) |

### 5. DB マイグレーション適用

```powershell
pnpm db:migrate:deploy
```

`prisma/migrations/` 配下の SQL を `dev` ブランチに適用する。

### 6. 起動

```powershell
pnpm dev
```

http://localhost:3000 を開いて Google ログイン → 設定で「Google Calendar を連携」→ 動作確認。

### 開発時に使うコマンド

| コマンド | 用途 |
|---|---|
| `pnpm dev` | 開発サーバ |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | `vitest run` (`TZ=UTC` で実行) |
| `pnpm lint` | ESLint |
| `pnpm build` | `prisma generate && next build` |
| `pnpm db:migrate` | スキーマ変更時に migration を生成 + dev に適用 |
| `pnpm db:migrate:deploy` | 既存 migration を流す (本番への手動適用に使う) |
| `pnpm db:studio` | Prisma Studio で DB を見る |

### 本番デプロイ (Vercel)

1. Neon `production` ブランチの **pooled connection** URL を控える
2. Google OAuth に本番 URL (`https://<your>.vercel.app`) の生成元 / リダイレクト URI を **追加** (ローカル分は残す)
3. Vercel で GitHub リポジトリを Import → Environment Variables に上の 6 個を設定 (`DATABASE_URL` は production の **pooler** URL) → Deploy
4. スキーマ変更を含む push の前に、本番 DB に migration を適用:
   ```powershell
   $env:DATABASE_URL = "production の direct URL"
   pnpm db:migrate:deploy
   Remove-Item Env:DATABASE_URL
   ```

> Vercel の env を変更したら **Redeploy** が必要 (既存ビルドには反映されない)。

---

## ライセンス

(未設定)
