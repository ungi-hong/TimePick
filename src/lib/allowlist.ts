const parseAllowlist = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// gmail / googlemail のローカルパートを正規化 (+suffix を捨てる + ドットを除去)
const normalizeForCompare = (email: string): string => {
  const lower = email.trim().toLowerCase();
  const at = lower.indexOf("@");
  if (at < 0) return lower;
  const local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const base = local.split("+")[0].replace(/\./g, "");
    return `${base}@gmail.com`;
  }
  return lower;
};

export const isEmailAllowed = (email: string | null | undefined): boolean => {
  // 明示的に公開モードを許す環境変数。本番でうっかり ALLOWED_EMAILS を消した
  // ときに誰でも入れる事故を防ぐ。
  if (process.env.ALLOW_PUBLIC_SIGNUP === "true") return true;

  const list = parseAllowlist(process.env.ALLOWED_EMAILS);
  if (list.length === 0) return false; // fail-closed
  if (!email) return false;

  const target = normalizeForCompare(email);
  return list.some((entry) => normalizeForCompare(entry) === target);
};
