"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 30_000;
const FADE_MS = 1_200;
const SEEN_KEY = "daily-prompt-seen";

function hasSeen(content: string) {
  try {
    return localStorage.getItem(SEEN_KEY) === content;
  } catch {
    return false;
  }
}

function markSeen(content: string) {
  try {
    localStorage.setItem(SEEN_KEY, content);
  } catch {}
}

/**
 * 오늘의 한마디. 페이지를 막지 않도록 화면이 뜬 뒤에 불러오고,
 * 준비되면 조용히 나타났다가 30초 뒤 사라진다.
 * 끝까지 보여준 한마디는 이 기기에서 다시 띄우지 않는다 (다음 날 새 한마디부터 다시).
 * 실패하면 아무것도 보이지 않는다.
 */
export default function DailyPrompt() {
  const [content, setContent] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-prompt")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.content && !hasSeen(data.content)) {
          setContent(data.content);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!content) return;
    const fadeTimer = setTimeout(() => setFading(true), VISIBLE_MS);
    const goneTimer = setTimeout(() => {
      setGone(true);
      markSeen(content);
    }, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, [content]);

  if (!content || gone) return null;

  return (
    <p
      className={`mb-10 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 animate-[fadein_1.2s_ease-out] transition-opacity duration-[1200ms] ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {content}
    </p>
  );
}
