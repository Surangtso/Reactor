import { headers } from "next/headers";

// 한국 IP로 접속한 요청은 한국 시간 자정을 하루의 경계로 쓰고,
// 그 외(해외 IP, 로컬 개발 등)는 기존처럼 UTC 기준으로 둔다.
// 국가 정보는 Vercel이 요청마다 붙여주는 x-vercel-ip-country 헤더에서 읽는다.
const KOREA_TIME_ZONE = "Asia/Seoul";
const DEFAULT_TIME_ZONE = "UTC";

export async function getTimeZone(): Promise<string> {
  const country = (await headers()).get("x-vercel-ip-country");
  return country === "KR" ? KOREA_TIME_ZONE : DEFAULT_TIME_ZONE;
}

/** 해당 시간대 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 해당 시간대 기준 오늘 0시를 ISO 시각으로 */
export function startOfTodayIn(timeZone: string): string {
  const offset = timeZone === KOREA_TIME_ZONE ? "+09:00" : "Z";
  return new Date(`${todayIn(timeZone)}T00:00:00${offset}`).toISOString();
}

export async function getToday(): Promise<string> {
  return todayIn(await getTimeZone());
}
