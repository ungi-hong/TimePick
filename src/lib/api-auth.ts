import { NextResponse } from "next/server";
import { auth } from "@/auth";

const unauthorized = () =>
  NextResponse.json({ error: "unauthorized" }, { status: 401 });

// API route の最初に呼ぶ helper。
// 戻り値が string なら userId、NextResponse ならそのまま return すれば 401 が返る。
//
// 使い方:
//   const auth = await requireUserId();
//   if (auth instanceof NextResponse) return auth;
//   const userId = auth;
export const requireUserId = async (): Promise<string | NextResponse> => {
  const session = await auth();
  return session?.user?.id ?? unauthorized();
};
