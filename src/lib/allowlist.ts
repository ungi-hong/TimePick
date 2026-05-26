const parseAllowlist = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isEmailAllowed = (email: string | null | undefined): boolean => {
  const list = parseAllowlist(process.env.ALLOWED_EMAILS);
  if (list.length === 0) return true; // 公開モード (allowlist 未設定)
  if (!email) return false;
  return list.includes(email.toLowerCase());
};
