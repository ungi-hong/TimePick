import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session) redirect("/");

  const { error } = await searchParams;

  const errorMessage =
    error === "AccessDenied"
      ? "このアカウントには TimePick へのアクセス権限がありません。"
      : error
        ? "ログインに失敗しました。もう一度お試しください。"
        : null;

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">TimePick</h1>
          <p className="text-sm text-muted-foreground">
            面談スケジューリングカレンダー
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          className="space-y-2"
        >
          <Button type="submit" className="w-full" size="lg">
            Google でログイン
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            初回ログイン後、設定画面から Google Calendar を連携できます。
          </p>
        </form>
      </div>
    </main>
  );
}
