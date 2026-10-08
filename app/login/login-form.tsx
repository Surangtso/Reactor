"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PrivacyHint from "../privacy-hint";

export default function LoginForm({ hasAuthError }: { hasAuthError: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 모바일 브라우저 자동완성은 종종 React의 onChange를 건너뛰고 값을
    // 채워 넣는다 — state가 아니라 실제 DOM 값을 기준으로 판단한다.
    const submittedEmail =
      (new FormData(e.currentTarget).get("email") as string | null)?.trim() ??
      "";
    if (!submittedEmail || status === "sending") return;

    setEmail(submittedEmail);
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: submittedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            로그인
          </h1>
          <PrivacyHint />
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          이메일로 로그인 링크를 보내드릴게요. 비밀번호는 필요 없어요.
        </p>

        {hasAuthError && status === "idle" && (
          <p className="text-sm text-red-500 mb-6">
            로그인 링크가 만료되었거나 이미 사용된 것 같아요. 아래에서 새
            링크를 받아주세요.
          </p>
        )}

        {status === "sent" ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <strong>{email}</strong> 주소로 로그인 링크를 보냈어요. 메일함을
            확인해주세요.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-maroon text-white px-5 py-2 text-sm font-medium disabled:opacity-40"
            >
              {status === "sending" ? "보내는 중..." : "로그인 링크 받기"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-500">
                링크 전송에 실패했어요. 다시 시도해주세요.
              </p>
            )}
          </form>
        )}

        <p className="mt-8 text-xs text-zinc-400">
          로그인하면{" "}
          <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다. (만 14세 이상)
        </p>
      </div>
    </div>
  );
}
