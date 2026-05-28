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

## アーキテクチャ

### ディレクトリ構成

```
src/
├── app/                          ← Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/   ← Auth.js
│   │   ├── availability/         ← 稼働時間 / 例外日
│   │   ├── calendar/busy/        ← Google Calendar の busy 取得 (自分の書いたイベントは除外)
│   │   ├── meetings/             ← 確定済み面談 (CRUD)
│   │   └── proposals/            ← 候補 (CRUD / generate / stale / touch)
│   ├── login/page.tsx
│   ├── settings/page.tsx         ← 稼働時間・連携設定
│   ├── page.tsx                  ← ホーム (カレンダー)
│   └── layout.tsx
├── features/                     ← feature-based コンポーネント
│   ├── availability/             ← AvailabilityForm, ExceptionsList
│   ├── calendar/                 ← Shell / View / Header / MiniCalendar / SidebarLists / EventInfoDialog
│   │   └── views/                ← MonthView / WeekView / DayView / ScheduleView
│   ├── meeting/                  ← MeetingDialog
│   └── proposal/                 ← ProposalGenerateDialog / ProposalManageDialog / ConfirmMeetingDialog / StaleProposalsBanner
├── components/
│   ├── ui/                       ← shadcn primitives + ResponsiveModalContent + Skeleton
│   └── GlobalProgressBar.tsx     ← React Query 進行中表示
├── lib/                          ← 共有ロジック
│   ├── api-auth.ts               ← requireUserId() helper
│   ├── availability.ts           ← 稼働時間 schema (Zod)
│   ├── calendar-connection.ts    ← Google 連携状態の判定 / 解除
│   ├── calendar-events.ts        ← busy/proposal/meeting/holiday を CellEvent に正規化
│   ├── datetime.ts               ← JST 基準の日付ヘルパー (ランタイム TZ 非依存)
│   ├── db.ts                     ← Prisma Client (起動時 DATABASE_URL を assert)
│   ├── google-calendar.ts        ← Google Calendar API ラッパー
│   ├── holiday.ts                ← 日本の祝日判定 (JST 正規化済み)
│   ├── linkify.tsx               ← description 内 URL のリンク化 / isSafeHttpUrl
│   ├── proposal-format.ts        ← 候補の日付グループ化 / コピー文言生成
│   ├── proposal-generator.ts     ← 空き時間アルゴリズム
│   └── use-*.ts                  ← React Query フック (use-busy-events, use-proposals, use-meetings)
├── generated/prisma/             ← `prisma generate` の出力 (gitignored)
└── proxy.ts                      ← Auth.js middleware (Edge runtime)
```

### コンポーネント設計方針

複雑度に応じて 3 段階に分割する:

**Tier 1 (form / mutation あり)** = `index.tsx` + `view.tsx` + `use-*.ts` + `service.ts`
- `service.ts`: 純粋関数 + API 呼び出し (React 非依存、Vitest で単体テスト可能)
- `use-*.ts`: hook で state / mutation / handler を集約
- `view.tsx`: props のみを受ける純粋 component
- `index.tsx`: hook を呼んで view に props を渡す結線役
- 対象: `ConfirmMeetingDialog` / `ProposalGenerateDialog` / `ProposalManageDialog` / `StaleProposalsBanner` / `MeetingDialog` / `AvailabilityForm` / `ExceptionsList` / `SidebarLists`

**Tier 2 (state あり、純粋ロジックは lib/ にある)** = `index.tsx` + `view.tsx` + `use-*.ts`
- service レイヤーは省略 (`lib/calendar-events.ts` などが代わりに担う)
- 対象: `CalendarShell` / `CalendarView` / `MiniCalendar` / `MonthView` / `WeekView` / `DayView` / `ScheduleView`

**Tier 3 (薄い表示専用)** = 単一ファイル
- 対象: `CalendarHeader` / `EventInfoDialog`

dialog 系では親が `key={target.id}` を渡すことで内部 state をリセットさせている (子 hook の `appliedKey` トラッキングは廃止)。

### 認証 / 認可

- **Auth.js v5** (`session: { strategy: "jwt" }`) + **Prisma Adapter**
- `auth.config.ts` は Edge runtime 安全 (DB 非依存) で middleware から共有される
- `signIn` callback で **allowlist** (`lib/allowlist.ts`) を通過したメールだけサインインを許可
  - 空 allowlist は fail-closed (`ALLOW_PUBLIC_SIGNUP=true` を明示しない限り全拒否)
  - gmail / googlemail のドットと `+` エイリアスは正規化して比較
- API route はすべて `lib/api-auth.ts#requireUserId()` で session を確認 + `prisma.findFirst({ where: { id, userId } })` で IDOR を防止

### Google Calendar 同期パターン

書き込み系 API は **「DB を先に確定 → Google を後から → 失敗時 DB ロールバック」** で統一している (saga パターン):

| API | 順序 | 失敗時の挙動 |
|---|---|---|
| `POST /api/meetings` | DB (Meeting 作成 + Proposal CONFIRMED) → Google insert | Google 失敗時に Meeting 削除 + Proposal を OPEN に戻す |
| `PATCH /api/meetings/[id]` | DB update → Google patch | Google 失敗時に DB を旧値にロールバック |
| `DELETE /api/meetings/[id]` | Google delete → DB delete | 403 (権限失効) のみ DB を消す。他 5xx は 502 を返す |
| `POST /api/proposals` | DB 作成 → 各 slot を Google に書き込み | 部分失敗の slot ID を `googleSyncFailedSlotIds` で返す |
| `PATCH /api/proposals/[id]` | DB update → Google label patch | 失敗を `googleSyncFailed: boolean` で返す |

`/api/calendar/busy` では **TimePick 自身が書いたイベント** (`ProposalSlot.googleEventId` / `Meeting.googleEventId` と一致するもの) を除外することで Google Calendar 側のコピーとの二重表示を防ぐ。

### 候補生成アルゴリズム (`lib/proposal-generator.ts`)

1. `from` 〜 `to` の各日について JST 基準で曜日 / 祝日判定 → 稼働時間ウィンドウを取得
2. ウィンドウから conflicts (busy + 既存 proposal + 既存 meeting + バッファ) を差し引いて空き時間レンジを得る
3. `minRangeMinutes` 未満のレンジは除外して時刻順に返す

時刻処理は **すべて `formatInTimeZone(date, "Asia/Tokyo", ...)` 経由で JST に正規化** している (ランタイム TZ が UTC でも JST でも結果が一致するよう、Vitest は `TZ=UTC` で実行している)。

### データモデル (`prisma/schema.prisma`)

- `User` (1) — (N) `Proposal` (1) — (N) `ProposalSlot`
- `User` (1) — (N) `Meeting`
- `Proposal` (0..1) — (1) `Meeting` (確定で繋がる)
- `User` (1) — (1) `Availability` (1) — (N) `AvailabilityException`
- `Account` / `Session` / `VerificationToken` は Auth.js 標準モデル

### UX 周り

- `GlobalProgressBar` が React Query の `useIsFetching` / `useIsMutating` を監視して画面上部に細いバーを表示 (3rd party 依存なし)
- 初回ロード中の `SidebarLists` は Skeleton で空状態と区別
- 各 view footer に「予定を読み込み中…」を表示
- `ResponsiveModalContent` で PC = 中央ポップアップ / モバイル = 全画面シート を CSS だけで切替

### セキュリティ周り

- API 全 route が `requireUserId()` + `userId` スコープの prisma query で IDOR 対策
- description 内のリンク化は `dangerouslySetInnerHTML` を使わず React ノードを構築。`href` は `isSafeHttpUrl()` で `http(s)://` のみ通す
- `next.config.ts` に `X-Frame-Options: DENY` / `X-Content-Type-Options: nosniff` / `Referrer-Policy: strict-origin-when-cross-origin` / `Permissions-Policy` を設定

---

## ライセンス

(未設定)
