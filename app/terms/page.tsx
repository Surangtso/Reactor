import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/messages";
import { LegalLayout, List, Section } from "../legal-layout";

// 한국어판이 원문이다. 영어·중국어판은 번역본이며 내용이 다를 경우 한국어판이 우선한다.
// 내용을 바꿀 때는 세 언어를 함께 고친다.

const TITLE: Record<Locale, string> = {
  ko: "이용약관",
  en: "Terms of Service",
  zh: "使用条款",
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${TITLE[await getLocale()]} · Reactor` };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const Content = { ko: TermsKo, en: TermsEn, zh: TermsZh }[locale];
  return <Content />;
}

function TermsKo() {
  return (
    <LegalLayout locale="ko" title={TITLE.ko} effective="시행일자: 2026-09-03">
      <Section title="제1조 (목적)">
        <p>
          본 약관은 Reactor(이하 &ldquo;서비스&rdquo;)의 이용조건 및 절차, 이용자와 서비스
          운영자의 권리·의무 및 책임사항을 정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (정의)">
        <List>
          <li>&ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
          <li>&ldquo;기록&rdquo;이란 이용자가 서비스에 직접 작성하여 저장하는 글을 말합니다.</li>
          <li>
            &ldquo;AI 코멘트&rdquo;란 이용자의 기록을 바탕으로 인공지능 모델이 생성하여 제공하는
            짧은 코멘트 및 주간 편지를 말합니다.
          </li>
        </List>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <p>
          본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 운영자는 관련 법령을 위반하지
          않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 사전
          공지합니다.
        </p>
      </Section>

      <Section title="제4조 (이용계약의 성립)">
        <p>이용계약은 이용자가 이메일을 통한 로그인(매직링크) 절차를 완료함으로써 성립합니다.</p>
      </Section>

      <Section title="제5조 (서비스의 제공 및 변경)">
        <p>
          서비스는 이용자의 기록 작성·저장 및 이에 대한 AI 코멘트·주간 편지 제공을 핵심 기능으로
          합니다. 운영자는 서비스의 내용을 변경하거나 일시적으로 중단할 수 있으며, 이 경우 사전에
          공지함을 원칙으로 합니다.
        </p>
      </Section>

      <Section title="제6조 (이용자의 의무)">
        <List>
          <li>이용자는 본인의 계정을 타인에게 양도·대여할 수 없습니다.</li>
          <li>
            이용자는 관계 법령 및 본 약관을 준수해야 하며, 서비스를 이용하여 타인의 권리를
            침해하거나 불법적인 목적으로 사용해서는 안 됩니다.
          </li>
        </List>
      </Section>

      <Section title="제7조 (AI 코멘트에 관한 유의사항 및 면책)">
        <p>
          AI 코멘트 및 주간 편지는 인공지능 모델이 이용자의 기록을 바탕으로 자동 생성하는
          결과물로,{" "}
          <strong>전문적인 심리상담, 의료적 진단이나 치료, 법률·재정 자문을 대체하지 않습니다.</strong>{" "}
          그 내용의 정확성이나 완전성은 보장되지 않으며, 이용자는 이를 참고 자료로만 활용해야
          합니다.
        </p>
        <p className="mt-3">
          이용자가 깊은 심리적 어려움을 겪고 있거나 위기 상황에 있다고 느껴진다면, 서비스가 아닌
          정신건강 전문기관이나 상담기관에 도움을 요청하시기 바랍니다.
        </p>
      </Section>

      <Section title="제8조 (저작권)">
        <p>
          이용자가 작성한 기록에 대한 저작권은 이용자 본인에게 있습니다. 운영자는 AI 코멘트 생성
          등 서비스 제공 목적으로만 해당 기록을 처리하며, 이용자의 동의 없이 다른 목적으로
          이용하지 않습니다.
        </p>
      </Section>

      <Section title="제9조 (계약의 해지)">
        <p>
          이용자는 언제든지 서비스 내 기능 또는 문의를 통해 이용계약을 해지(회원 탈퇴)할 수
          있으며, 이 경우 저장된 기록은{" "}
          <Link href="/privacy" className="underline">
            개인정보처리방침
          </Link>
          에 따라 지체 없이 삭제됩니다.
        </p>
      </Section>

      <Section title="제10조 (면책조항)">
        <p>
          운영자는 천재지변, 이용자의 귀책사유, 제3자(AI·인프라 제공업체 등)의 서비스 장애 등
          운영자가 통제할 수 없는 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="제11조 (이용 자격)">
        <p>서비스는 만 14세 이상만 이용할 수 있습니다.</p>
      </Section>

      <Section title="제12조 (준거법 및 관할)">
        <p>
          본 약관은 대한민국 법령에 따라 규율되며, 서비스 이용과 관련하여 분쟁이 발생할 경우 관계
          법령이 정한 절차에 따릅니다.
        </p>
      </Section>

      <Section title="문의처">
        <p>운영자: 정수빈 (jsubini02@naver.com)</p>
      </Section>
    </LegalLayout>
  );
}

function TermsEn() {
  return (
    <LegalLayout locale="en" title={TITLE.en} effective="Effective date: September 3, 2026">
      <Section title="Article 1 (Purpose)">
        <p>
          These Terms set out the conditions and procedures for using Reactor (the
          &ldquo;Service&rdquo;), and the rights, obligations, and responsibilities of users and
          the Service operator.
        </p>
      </Section>

      <Section title="Article 2 (Definitions)">
        <List>
          <li>&ldquo;User&rdquo; means a person who uses the Service under these Terms.</li>
          <li>&ldquo;Note&rdquo; means writing that a user creates and saves in the Service.</li>
          <li>
            &ldquo;AI comment&rdquo; means the short comments and weekly letters that an
            artificial intelligence model generates and provides based on a user&rsquo;s notes.
          </li>
        </List>
      </Section>

      <Section title="Article 3 (Effect and amendment of the Terms)">
        <p>
          These Terms take effect when posted on the Service. The operator may amend these Terms
          within the limits of applicable law, and will give advance notice stating the
          effective date and reason for any amendment.
        </p>
      </Section>

      <Section title="Article 4 (Formation of the agreement)">
        <p>
          The user agreement is formed when a user completes the login procedure via email
          (magic link).
        </p>
      </Section>

      <Section title="Article 5 (Provision and changes of the Service)">
        <p>
          The Service&rsquo;s core features are writing and saving notes and providing AI
          comments and weekly letters on them. The operator may change the Service or suspend it
          temporarily, and will, as a rule, give advance notice when doing so.
        </p>
      </Section>

      <Section title="Article 6 (User obligations)">
        <List>
          <li>Users may not transfer or lend their account to others.</li>
          <li>
            Users must comply with applicable law and these Terms, and must not use the Service
            to infringe the rights of others or for any unlawful purpose.
          </li>
        </List>
      </Section>

      <Section title="Article 7 (Notes on AI comments and disclaimer)">
        <p>
          AI comments and weekly letters are generated automatically by an artificial
          intelligence model based on a user&rsquo;s notes, and{" "}
          <strong>
            do not replace professional counseling, medical diagnosis or treatment, or legal or
            financial advice.
          </strong>{" "}
          Their accuracy and completeness are not guaranteed, and users should treat them only
          as reference.
        </p>
        <p className="mt-3">
          If you are going through serious psychological difficulty or feel you are in crisis,
          please seek help from a mental health professional or counseling service rather than
          the Service.
        </p>
      </Section>

      <Section title="Article 8 (Copyright)">
        <p>
          Copyright in the notes a user writes belongs to that user. The operator processes those
          notes only to provide the Service, such as generating AI comments, and does not use
          them for any other purpose without the user&rsquo;s consent.
        </p>
      </Section>

      <Section title="Article 9 (Termination)">
        <p>
          Users may terminate the agreement (delete their account) at any time through features
          in the Service or by contacting us, in which case stored notes are deleted without
          delay in accordance with the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Article 10 (Limitation of liability)">
        <p>
          The operator is not liable for interruptions of the Service caused by circumstances
          beyond the operator&rsquo;s control, such as natural disasters, causes attributable to
          the user, or outages of third parties (such as AI or infrastructure providers).
        </p>
      </Section>

      <Section title="Article 11 (Eligibility)">
        <p>The Service is available only to people aged 14 and over.</p>
      </Section>

      <Section title="Article 12 (Governing law and jurisdiction)">
        <p>
          These Terms are governed by the laws of the Republic of Korea, and any dispute
          relating to the use of the Service will follow the procedures set by applicable law.
        </p>
      </Section>

      <Section title="Contact">
        <p>Operator: 정수빈 (jsubini02@naver.com)</p>
      </Section>
    </LegalLayout>
  );
}

function TermsZh() {
  return (
    <LegalLayout locale="zh" title={TITLE.zh} effective="生效日期：2026年9月3日">
      <Section title="第1条（目的）">
        <p>
          本条款旨在规定 Reactor（以下简称&ldquo;本服务&rdquo;）的使用条件及程序，以及用户与本服务运营者的权利、义务和责任事项。
        </p>
      </Section>

      <Section title="第2条（定义）">
        <List>
          <li>&ldquo;用户&rdquo;是指依据本条款使用本服务的人。</li>
          <li>&ldquo;记录&rdquo;是指用户在本服务中亲自撰写并保存的文字。</li>
          <li>&ldquo;AI 评论&rdquo;是指人工智能模型基于用户的记录生成并提供的简短评论及每周来信。</li>
        </List>
      </Section>

      <Section title="第3条（条款的效力及变更）">
        <p>
          本条款自在本服务页面公布之日起生效。运营者可在不违反相关法律法规的范围内变更本条款，变更时将注明生效日期及变更理由并提前公告。
        </p>
      </Section>

      <Section title="第4条（使用协议的成立）">
        <p>用户通过电子邮件完成登录（邮件登录链接）程序后，使用协议即告成立。</p>
      </Section>

      <Section title="第5条（服务的提供及变更）">
        <p>
          本服务以用户撰写、保存记录，以及针对记录提供 AI
          评论和每周来信为核心功能。运营者可以变更本服务的内容或暂时中断服务，原则上将提前公告。
        </p>
      </Section>

      <Section title="第6条（用户的义务）">
        <List>
          <li>用户不得将本人账号转让或出借给他人。</li>
          <li>用户应遵守相关法律法规及本条款，不得利用本服务侵害他人权利或用于非法目的。</li>
        </List>
      </Section>

      <Section title="第7条（关于 AI 评论的注意事项及免责）">
        <p>
          AI 评论及每周来信是人工智能模型基于用户记录自动生成的结果，
          <strong>不能替代专业心理咨询、医学诊断或治疗、法律或财务咨询。</strong>
          其内容的准确性和完整性不作保证，用户仅应将其作为参考。
        </p>
        <p className="mt-3">如果你正经历严重的心理困扰或感到身处危机，请向心理健康专业机构或咨询机构寻求帮助，而不是依赖本服务。</p>
      </Section>

      <Section title="第8条（著作权）">
        <p>
          用户所撰写记录的著作权归用户本人所有。运营者仅为提供本服务（如生成 AI
          评论）而处理相关记录，未经用户同意不会用于其他目的。
        </p>
      </Section>

      <Section title="第9条（协议的解除）">
        <p>
          用户可随时通过本服务内的功能或联系我们解除使用协议（注销账号），届时已保存的记录将依据
          <Link href="/privacy" className="underline">
            隐私政策
          </Link>
          立即删除。
        </p>
      </Section>

      <Section title="第10条（免责条款）">
        <p>
          对于因自然灾害、可归责于用户的原因、第三方（AI 及基础设施提供商等）服务故障等运营者无法控制的原因导致的服务中断，运营者不承担责任。
        </p>
      </Section>

      <Section title="第11条（使用资格）">
        <p>本服务仅供年满 14 岁的用户使用。</p>
      </Section>

      <Section title="第12条（准据法及管辖）">
        <p>本条款受大韩民国法律管辖。因使用本服务发生争议时，依照相关法律法规规定的程序处理。</p>
      </Section>

      <Section title="联系方式">
        <p>运营者：정수빈（jsubini02@naver.com）</p>
      </Section>
    </LegalLayout>
  );
}
