import Link from "next/link";

export const metadata = { title: "개인정보처리방침 · Reactor" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            개인정보처리방침
          </h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            홈으로
          </Link>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-zinc-400 text-xs">시행일자: 2026-09-30</p>

          <p>
            Reactor(이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를
            소중히 다루며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본
            방침은 서비스가 어떤 개인정보를 수집·이용·보관·파기하는지
            안내합니다.
          </p>

          <Section title="1. 수집하는 개인정보 항목">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                <strong>필수 항목</strong> — 이메일 주소 (로그인 및 본인 확인
                목적, 매직링크 방식)
              </li>
              <li>
                <strong>이용 중 생성되는 정보</strong> — 이용자가 직접
                작성한 기록(글 내용, 카테고리), 서비스가 그 기록을 바탕으로
                생성한 코멘트·주간 편지·오늘의 한마디·&lsquo;나의 생각들&rsquo; 글, 서비스의 AI가
                이용자를 기억하기 위해 기록을 정리한 내부 메모, 챕터(주제) 정보
              </li>
              <li>
                <strong>자동 수집 정보</strong> — 가입일시, 접속 로그,
                서비스 이용 기록, 접속 IP로 확인한 국가 정보(날짜 기준
                시간대를 정하는 데에만 쓰이며 저장하지 않음)
              </li>
            </ul>
          </Section>

          <Section title="2. 개인정보의 수집 및 이용 목적">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>회원 식별 및 로그인 처리</li>
              <li>이용자가 작성한 기록의 저장 및 조회</li>
              <li>
                AI(인공지능)를 이용한 코멘트·주간 편지·오늘의 한마디·&lsquo;나의
                생각들&rsquo; 생성 등 서비스 핵심 기능 제공
              </li>
              <li>서비스 운영, 오류 대응, 품질 개선</li>
            </ul>
          </Section>

          <Section title="3. 민감정보 처리에 관한 안내">
            <p>
              이용자가 서비스에 작성하는 기록에는 개인의 감정, 심리 상태 등
              민감한 내용이 자발적으로 포함될 수 있습니다. 이러한 내용은
              이용자 본인이 직접 입력한 경우에만 수집되며, 오직 위 2항의
              목적(코멘트·편지·오늘의 한마디·&lsquo;나의 생각들&rsquo; 생성 등 서비스
              제공)으로만 처리되고, 별도로
              분석·마케팅 등 다른 목적에 사용되지 않습니다.
            </p>
            <p className="mt-3">
              서비스는 전문적인 심리상담이나 의료 서비스를 제공하지
              않습니다. 자세한 내용은{" "}
              <Link href="/terms" className="underline">
                이용약관
              </Link>
              을 참고해 주세요.
            </p>
          </Section>

          <Section title="4. 개인정보의 보유 및 이용 기간">
            <p>
              이용자가 회원 탈퇴를 요청하는 즉시 지체 없이 개인정보를
              파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당
              법령이 정한 기간 동안 보관합니다.
            </p>
          </Section>

          <Section title="5. 개인정보의 처리 위탁 및 국외 이전">
            <p>서비스는 아래 업체에 다음과 같이 처리를 위탁하고 있습니다.</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-3">
              <li>
                <strong>Anthropic, PBC</strong> (미국) — AI 코멘트·주간
                편지·오늘의 한마디·&lsquo;나의 생각들&rsquo; 생성을 위해 이용자가
                작성한 기록 내용이 전송됩니다. Anthropic의 상용 약관에 따라,
                API로 전송된 데이터는 기본적으로 AI 모델 학습에 사용되지
                않습니다.
              </li>
              <li>
                <strong>Supabase, Inc.</strong> — 데이터베이스 저장 및
                로그인(인증) 처리. 서버 위치(리전): 호주 시드니 (AWS
                ap-southeast-2)
              </li>
              <li>
                <strong>Vercel, Inc.</strong> (미국) — 웹 서비스 호스팅 및
                서버 운영
              </li>
              <li>
                <strong>Resend</strong> (미국) — 로그인 이메일 발송 (이메일
                주소)
              </li>
            </ul>
            <p className="mt-3">
              위 업체는 각 사의 개인정보 처리방침 및 서비스 약관에 따라
              데이터를 처리하며, 서비스는 목적 외 이용을 요구하지 않습니다.
            </p>
          </Section>

          <Section title="6. 이용자의 권리와 행사 방법">
            <p>
              이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제,
              처리정지를 요구할 수 있으며, 회원 탈퇴를 통해 저장된 기록을
              모두 삭제할 수 있습니다. 아래 문의처로 요청해 주세요.
            </p>
          </Section>

          <Section title="7. 개인정보의 파기 절차 및 방법">
            <p>
              보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 전자적
              파일 형태의 경우 복구 불가능한 방법으로 즉시 삭제합니다.
            </p>
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            <p>
              서비스는 데이터베이스 접근 제어(행 단위 보안, Row Level
              Security)를 적용하여, 이용자는 본인의 기록에만 접근할 수 있고
              다른 이용자의 기록은 조회할 수 없습니다. 로그인 없이는 어떠한
              기록도 조회할 수 없습니다.
            </p>
            <p className="mt-3">
              <strong>
                작성한 기록은 이용자 본인만 볼 수 있으며, 운영자도 기록
                내용을 열어보지 않습니다.
              </strong>{" "}
              운영자는 서비스 운영을 위한 데이터베이스 관리 권한을 가지고
              있으나, 이용자가 직접 요청하거나 동의한 경우 또는 법령에 따라
              요구되는 경우를 제외하고는 기록 내용을 열람하지 않습니다.
            </p>
            <p className="mt-3">
              서비스는 서버 로그에 이용자의 기록 내용을 남기지 않습니다.
            </p>
          </Section>

          <Section title="9. 만 14세 미만 아동의 이용 제한">
            <p>
              서비스는 만 14세 이상만 이용할 수 있습니다. 만 14세 미만
              아동의 개인정보는 수집하지 않습니다.
            </p>
          </Section>

          <Section title="10. 개인정보 보호책임자 및 문의처">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>운영자: 정수빈</li>
              <li>연락처(이메일): jsubini02@naver.com</li>
            </ul>
          </Section>

          <Section title="11. 고지의 의무">
            <p>
              본 방침의 내용이 변경되는 경우 서비스 내 공지사항 또는 이
              페이지를 통해 고지합니다.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-black dark:text-zinc-50 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
