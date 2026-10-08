import Link from "next/link";

export const metadata = { title: "이용약관 · Reactor" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            이용약관
          </h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            홈으로
          </Link>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-zinc-400 text-xs">시행일자: 2026-09-03</p>

          <Section title="제1조 (목적)">
            <p>
              본 약관은 Reactor(이하 &ldquo;서비스&rdquo;)의 이용조건 및
              절차, 이용자와 서비스 운영자의 권리·의무 및 책임사항을
              정함을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 (정의)">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                &ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는
                자를 말합니다.
              </li>
              <li>
                &ldquo;기록&rdquo;이란 이용자가 서비스에 직접 작성하여
                저장하는 글을 말합니다.
              </li>
              <li>
                &ldquo;AI 코멘트&rdquo;란 이용자의 기록을 바탕으로 인공지능
                모델이 생성하여 제공하는 짧은 코멘트 및 주간 편지를
                말합니다.
              </li>
            </ul>
          </Section>

          <Section title="제3조 (약관의 효력 및 변경)">
            <p>
              본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
              운영자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수
              있으며, 변경 시 적용일자 및 변경사유를 명시하여 사전 공지합니다.
            </p>
          </Section>

          <Section title="제4조 (이용계약의 성립)">
            <p>
              이용계약은 이용자가 이메일을 통한 로그인(매직링크) 절차를
              완료함으로써 성립합니다.
            </p>
          </Section>

          <Section title="제5조 (서비스의 제공 및 변경)">
            <p>
              서비스는 이용자의 기록 작성·저장 및 이에 대한 AI 코멘트·주간
              편지 제공을 핵심 기능으로 합니다. 운영자는 서비스의 내용을
              변경하거나 일시적으로 중단할 수 있으며, 이 경우 사전에 공지함을
              원칙으로 합니다.
            </p>
          </Section>

          <Section title="제6조 (이용자의 의무)">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>이용자는 본인의 계정을 타인에게 양도·대여할 수 없습니다.</li>
              <li>
                이용자는 관계 법령 및 본 약관을 준수해야 하며, 서비스를
                이용하여 타인의 권리를 침해하거나 불법적인 목적으로 사용해서는
                안 됩니다.
              </li>
            </ul>
          </Section>

          <Section title="제7조 (AI 코멘트에 관한 유의사항 및 면책)">
            <p>
              AI 코멘트 및 주간 편지는 인공지능 모델이 이용자의 기록을
              바탕으로 자동 생성하는 결과물로, <strong>전문적인 심리상담,
              의료적 진단이나 치료, 법률·재정 자문을 대체하지 않습니다.</strong>{" "}
              그 내용의 정확성이나 완전성은 보장되지 않으며, 이용자는 이를
              참고 자료로만 활용해야 합니다.
            </p>
            <p className="mt-3">
              이용자가 깊은 심리적 어려움을 겪고 있거나 위기 상황에 있다고
              느껴진다면, 서비스가 아닌 정신건강 전문기관이나 상담기관에
              도움을 요청하시기 바랍니다.
            </p>
          </Section>

          <Section title="제8조 (저작권)">
            <p>
              이용자가 작성한 기록에 대한 저작권은 이용자 본인에게
              있습니다. 운영자는 AI 코멘트 생성 등 서비스 제공 목적으로만
              해당 기록을 처리하며, 이용자의 동의 없이 다른 목적으로
              이용하지 않습니다.
            </p>
          </Section>

          <Section title="제9조 (계약의 해지)">
            <p>
              이용자는 언제든지 서비스 내 기능 또는 문의를 통해 이용계약을
              해지(회원 탈퇴)할 수 있으며, 이 경우 저장된 기록은{" "}
              <Link href="/privacy" className="underline">
                개인정보처리방침
              </Link>
              에 따라 지체 없이 삭제됩니다.
            </p>
          </Section>

          <Section title="제10조 (면책조항)">
            <p>
              운영자는 천재지변, 이용자의 귀책사유, 제3자(AI·인프라
              제공업체 등)의 서비스 장애 등 운영자가 통제할 수 없는 사유로
              인한 서비스 중단에 대해 책임을 지지 않습니다.
            </p>
          </Section>

          <Section title="제11조 (이용 자격)">
            <p>서비스는 만 14세 이상만 이용할 수 있습니다.</p>
          </Section>

          <Section title="제12조 (준거법 및 관할)">
            <p>
              본 약관은 대한민국 법령에 따라 규율되며, 서비스 이용과
              관련하여 분쟁이 발생할 경우 관계 법령이 정한 절차에 따릅니다.
            </p>
          </Section>

          <Section title="문의처">
            <p>운영자: 정수빈 (jsubini02@naver.com)</p>
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
