"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PrivacyHint from "../privacy-hint";
import { LanguageSwitcher, useI18n } from "../locale-provider";

export default function LoginForm({ hasAuthError }: { hasAuthError: boolean }) {
  const { locale, m } = useI18n();
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
        // 처음 가입할 때 화면 언어를 사용자 정보에 남겨, 로그인 메일을 그 언어로 보낸다
        // (Supabase 메일 템플릿이 .Data.locale을 보고 문구를 고른다).
        data: { locale },
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {m.login.title}
          </h1>
          <PrivacyHint />
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          {m.login.intro}
        </p>

        {hasAuthError && status === "idle" && (
          <p className="text-sm text-red-500 mb-6">
            {m.login.authError}
          </p>
        )}

        {status === "sent" ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {m.login.sentBefore}
            <strong>{email}</strong>
            {m.login.sentAfter}
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
              {status === "sending" ? m.login.sending : m.login.send}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-500">
                {m.login.sendFailed}
              </p>
            )}
          </form>
        )}

        <p className="mt-8 text-xs text-zinc-400">
          {m.login.consentBefore}
          <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            {m.login.terms}
          </Link>
          {m.login.and}
          <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            {m.login.privacy}
          </Link>
          {m.login.consentAfter}
        </p>
        <LanguageSwitcher className="mt-6" />
      </div>
    </div>
  );
}
