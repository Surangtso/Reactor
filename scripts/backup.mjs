// 수동 DB 백업: public 스키마의 모든 유저 데이터를 JSON으로 내보낸다.
// 사용법: npm run backup
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "node:fs/promises";

const TABLES = [
  "chapters",
  "entries",
  "reflections",
  "narratives",
  "session_summaries",
  "events",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다. Supabase 대시보드 > Settings > API Keys > Legacy에서 service_role 키를 복사해 추가하세요.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = `backups/${timestamp}`;
await mkdir(outDir, { recursive: true });

let hadError = false;

for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select("*");

  if (error) {
    console.error(`[${table}] 실패:`, error.message);
    hadError = true;
    continue;
  }

  await writeFile(
    `${outDir}/${table}.json`,
    JSON.stringify(data, null, 2),
    "utf-8",
  );
  console.log(`[${table}] ${data.length}건 저장 완료`);
}

if (hadError) {
  console.error("일부 테이블 백업 실패. 위 로그를 확인하세요.");
  process.exit(1);
}

console.log(`\n백업 완료: ${outDir}/`);
