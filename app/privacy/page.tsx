import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/messages";
import { LegalLayout, List, Section } from "../legal-layout";

// 한국어판이 원문이다. 영어·중국어판은 번역본이며 내용이 다를 경우 한국어판이 우선한다.
// 내용을 바꿀 때는 세 언어를 함께 고친다.

const TITLE: Record<Locale, string> = {
  ko: "개인정보처리방침",
  en: "Privacy Policy",
  zh: "隐私政策",
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${TITLE[await getLocale()]} · Reactor` };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const Content = { ko: PrivacyKo, en: PrivacyEn, zh: PrivacyZh }[locale];
  return <Content />;
}

function PrivacyKo() {
  return (
    <LegalLayout locale="ko" title={TITLE.ko} effective="시행일자: 2026-09-30">
      <p>
        Reactor(이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를 소중히 다루며, 「개인정보
        보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스가 어떤 개인정보를
        수집·이용·보관·파기하는지 안내합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <List>
          <li>
            <strong>필수 항목</strong> — 이메일 주소 (로그인 및 본인 확인 목적, 매직링크 방식)
          </li>
          <li>
            <strong>이용 중 생성되는 정보</strong> — 이용자가 직접 작성한 기록(글 내용,
            카테고리), 서비스가 그 기록을 바탕으로 생성한 코멘트·주간 편지·오늘의
            한마디·&lsquo;나의 생각들&rsquo; 글, 서비스의 AI가 이용자를 기억하기 위해 기록을
            정리한 내부 메모, 챕터(주제) 정보
          </li>
          <li>
            <strong>자동 수집 정보</strong> — 가입일시, 접속 로그, 서비스 이용 기록, 접속
            IP로 확인한 국가 정보(날짜 기준 시간대를 정하는 데에만 쓰이며 저장하지 않음)
          </li>
        </List>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <List>
          <li>회원 식별 및 로그인 처리</li>
          <li>이용자가 작성한 기록의 저장 및 조회</li>
          <li>
            AI(인공지능)를 이용한 코멘트·주간 편지·오늘의 한마디·&lsquo;나의 생각들&rsquo; 생성
            등 서비스 핵심 기능 제공
          </li>
          <li>서비스 운영, 오류 대응, 품질 개선</li>
        </List>
      </Section>

      <Section title="3. 민감정보 처리에 관한 안내">
        <p>
          이용자가 서비스에 작성하는 기록에는 개인의 감정, 심리 상태 등 민감한 내용이
          자발적으로 포함될 수 있습니다. 이러한 내용은 이용자 본인이 직접 입력한 경우에만
          수집되며, 오직 위 2항의 목적(코멘트·편지·오늘의 한마디·&lsquo;나의 생각들&rsquo; 생성
          등 서비스 제공)으로만 처리되고, 별도로 분석·마케팅 등 다른 목적에 사용되지
          않습니다.
        </p>
        <p className="mt-3">
          서비스는 전문적인 심리상담이나 의료 서비스를 제공하지 않습니다. 자세한 내용은{" "}
          <Link href="/terms" className="underline">
            이용약관
          </Link>
          을 참고해 주세요.
        </p>
      </Section>

      <Section title="4. 개인정보의 보유 및 이용 기간">
        <p>
          이용자가 회원 탈퇴를 요청하는 즉시 지체 없이 개인정보를 파기합니다. 다만 관계
          법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.
        </p>
      </Section>

      <Section title="5. 개인정보의 처리 위탁 및 국외 이전">
        <p>서비스는 아래 업체에 다음과 같이 처리를 위탁하고 있습니다.</p>
        <div className="mt-3">
          <List>
            <li>
              <strong>Anthropic, PBC</strong> (미국) — AI 코멘트·주간 편지·오늘의
              한마디·&lsquo;나의 생각들&rsquo; 생성을 위해 이용자가 작성한 기록 내용이
              전송됩니다. Anthropic의 상용 약관에 따라, API로 전송된 데이터는 기본적으로 AI
              모델 학습에 사용되지 않습니다.
            </li>
            <li>
              <strong>Supabase, Inc.</strong> — 데이터베이스 저장 및 로그인(인증) 처리. 서버
              위치(리전): 호주 시드니 (AWS ap-southeast-2)
            </li>
            <li>
              <strong>Vercel, Inc.</strong> (미국) — 웹 서비스 호스팅 및 서버 운영
            </li>
            <li>
              <strong>Resend</strong> (미국) — 로그인 이메일 발송 (이메일 주소)
            </li>
          </List>
        </div>
        <p className="mt-3">
          위 업체는 각 사의 개인정보 처리방침 및 서비스 약관에 따라 데이터를 처리하며,
          서비스는 목적 외 이용을 요구하지 않습니다.
        </p>
      </Section>

      <Section title="6. 이용자의 권리와 행사 방법">
        <p>
          이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수
          있으며, 회원 탈퇴를 통해 저장된 기록을 모두 삭제할 수 있습니다. 아래 문의처로
          요청해 주세요.
        </p>
      </Section>

      <Section title="7. 개인정보의 파기 절차 및 방법">
        <p>
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 전자적 파일 형태의 경우 복구
          불가능한 방법으로 즉시 삭제합니다.
        </p>
      </Section>

      <Section title="8. 개인정보의 안전성 확보 조치">
        <p>
          서비스는 데이터베이스 접근 제어(행 단위 보안, Row Level Security)를 적용하여,
          이용자는 본인의 기록에만 접근할 수 있고 다른 이용자의 기록은 조회할 수 없습니다.
          로그인 없이는 어떠한 기록도 조회할 수 없습니다.
        </p>
        <p className="mt-3">
          <strong>
            작성한 기록은 이용자 본인만 볼 수 있으며, 운영자도 기록 내용을 열어보지
            않습니다.
          </strong>{" "}
          운영자는 서비스 운영을 위한 데이터베이스 관리 권한을 가지고 있으나, 이용자가 직접
          요청하거나 동의한 경우 또는 법령에 따라 요구되는 경우를 제외하고는 기록 내용을
          열람하지 않습니다.
        </p>
        <p className="mt-3">서비스는 서버 로그에 이용자의 기록 내용을 남기지 않습니다.</p>
      </Section>

      <Section title="9. 만 14세 미만 아동의 이용 제한">
        <p>
          서비스는 만 14세 이상만 이용할 수 있습니다. 만 14세 미만 아동의 개인정보는
          수집하지 않습니다.
        </p>
      </Section>

      <Section title="10. 개인정보 보호책임자 및 문의처">
        <List>
          <li>운영자: 정수빈</li>
          <li>연락처(이메일): jsubini02@naver.com</li>
        </List>
      </Section>

      <Section title="11. 고지의 의무">
        <p>본 방침의 내용이 변경되는 경우 서비스 내 공지사항 또는 이 페이지를 통해 고지합니다.</p>
      </Section>
    </LegalLayout>
  );
}

function PrivacyEn() {
  return (
    <LegalLayout locale="en" title={TITLE.en} effective="Effective date: September 30, 2026">
      <p>
        Reactor (the &ldquo;Service&rdquo;) values your personal information and complies with
        applicable laws, including the Personal Information Protection Act of the Republic of
        Korea. This policy explains what personal information the Service collects, and how it
        is used, retained, and deleted.
      </p>

      <Section title="1. Personal information we collect">
        <List>
          <li>
            <strong>Required</strong> — Email address (for login and identity verification via
            magic link)
          </li>
          <li>
            <strong>Information created as you use the Service</strong> — Notes you write
            (content and category); comments, weekly letters, daily prompts, and &lsquo;My
            thoughts&rsquo; pieces the Service generates from those notes; internal notes in
            which the Service&rsquo;s AI organizes your entries in order to remember you; and
            chapter (theme) information
          </li>
          <li>
            <strong>Collected automatically</strong> — Sign-up time, access logs, usage
            records, and the country identified from your IP address (used only to determine
            the time zone for dates, and not stored)
          </li>
        </List>
      </Section>

      <Section title="2. Purposes of collection and use">
        <List>
          <li>Identifying members and handling login</li>
          <li>Storing and displaying the notes you write</li>
          <li>
            Providing the Service&rsquo;s core features, such as AI-generated comments, weekly
            letters, daily prompts, and &lsquo;My thoughts&rsquo;
          </li>
          <li>Operating the Service, responding to errors, and improving quality</li>
        </List>
      </Section>

      <Section title="3. About sensitive information">
        <p>
          Your notes may voluntarily include sensitive content such as your emotions or state
          of mind. Such content is collected only when you enter it yourself, is processed
          solely for the purposes in Section 2 (providing the Service, such as generating
          comments, letters, daily prompts, and &lsquo;My thoughts&rsquo;), and is not used for
          any other purpose, such as separate analysis or marketing.
        </p>
        <p className="mt-3">
          The Service does not provide professional counseling or medical services. For
          details, please see the{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          .
        </p>
      </Section>

      <Section title="4. Retention period">
        <p>
          When you request to delete your account, we delete your personal information without
          delay. Where retention is required by law, we keep it only for the period the law
          specifies.
        </p>
      </Section>

      <Section title="5. Processors and international transfers">
        <p>The Service entrusts processing to the following companies:</p>
        <div className="mt-3">
          <List>
            <li>
              <strong>Anthropic, PBC</strong> (USA) — The content of your notes is sent to
              generate AI comments, weekly letters, daily prompts, and &lsquo;My thoughts&rsquo;.
              Under Anthropic&rsquo;s commercial terms, data sent through the API is not used to
              train AI models by default.
            </li>
            <li>
              <strong>Supabase, Inc.</strong> — Database storage and login (authentication).
              Server region: Sydney, Australia (AWS ap-southeast-2)
            </li>
            <li>
              <strong>Vercel, Inc.</strong> (USA) — Web hosting and server operation
            </li>
            <li>
              <strong>Resend</strong> (USA) — Sending login emails (email address)
            </li>
          </List>
        </div>
        <p className="mt-3">
          These companies process data under their own privacy policies and terms of service,
          and the Service does not ask them to use it for any other purpose.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          You may at any time request access to, correction of, deletion of, or suspension of
          processing of your personal information, and you can delete all stored notes by
          deleting your account. Please send requests to the contact below.
        </p>
      </Section>

      <Section title="7. How we delete information">
        <p>
          Personal information whose retention period has ended or whose purpose has been
          fulfilled is deleted immediately; electronic files are deleted in a way that cannot
          be recovered.
        </p>
      </Section>

      <Section title="8. Security measures">
        <p>
          The Service applies database access control (Row Level Security), so you can access
          only your own notes and cannot view anyone else&rsquo;s. No notes can be viewed
          without logging in.
        </p>
        <p className="mt-3">
          <strong>
            Only you can see the notes you write, and the operator does not open their
            content.
          </strong>{" "}
          The operator holds database administration rights to run the Service, but does not
          view the content of your notes except when you request or consent to it, or when
          required by law.
        </p>
        <p className="mt-3">The Service does not record the content of your notes in server logs.</p>
      </Section>

      <Section title="9. Children under 14">
        <p>
          The Service is available only to people aged 14 and over. We do not collect personal
          information from children under 14.
        </p>
      </Section>

      <Section title="10. Privacy officer and contact">
        <List>
          <li>Operator: 정수빈</li>
          <li>Email: jsubini02@naver.com</li>
        </List>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          If this policy changes, we will announce it through a notice in the Service or on
          this page.
        </p>
      </Section>
    </LegalLayout>
  );
}

function PrivacyZh() {
  return (
    <LegalLayout locale="zh" title={TITLE.zh} effective="生效日期：2026年9月30日">
      <p>
        Reactor（以下简称&ldquo;本服务&rdquo;）重视用户的个人信息，并遵守大韩民国《个人信息保护法》等相关法律法规。本政策说明本服务收集哪些个人信息，以及如何使用、保存和销毁这些信息。
      </p>

      <Section title="1. 收集的个人信息">
        <List>
          <li>
            <strong>必要信息</strong> — 电子邮箱地址（用于登录及身份确认，采用邮件登录链接方式）
          </li>
          <li>
            <strong>使用过程中产生的信息</strong> —
            用户亲自撰写的记录（内容、分类）；本服务基于这些记录生成的评论、每周来信、今日一句、&lsquo;我的思考&rsquo;文字；本服务的
            AI 为记住用户而整理记录所形成的内部备忘；章节（主题）信息
          </li>
          <li>
            <strong>自动收集的信息</strong> — 注册时间、访问日志、使用记录，以及通过访问 IP
            识别的国家信息（仅用于确定日期所依据的时区，不予保存）
          </li>
        </List>
      </Section>

      <Section title="2. 收集和使用目的">
        <List>
          <li>识别会员及处理登录</li>
          <li>保存和查看用户撰写的记录</li>
          <li>提供利用 AI（人工智能）生成评论、每周来信、今日一句、&lsquo;我的思考&rsquo;等核心功能</li>
          <li>运营本服务、处理故障、改进质量</li>
        </List>
      </Section>

      <Section title="3. 关于敏感信息">
        <p>
          用户在本服务中撰写的记录可能会自愿包含个人情绪、心理状态等敏感内容。此类内容仅在用户本人亲自输入时收集，且仅为上述第
          2 条的目的（生成评论、来信、今日一句、&lsquo;我的思考&rsquo;等服务提供）而处理，不会另作分析、营销等其他用途。
        </p>
        <p className="mt-3">
          本服务不提供专业心理咨询或医疗服务。详情请参阅
          <Link href="/terms" className="underline">
            使用条款
          </Link>
          。
        </p>
      </Section>

      <Section title="4. 保存期限">
        <p>
          用户申请注销账号后，我们将立即销毁其个人信息。但如相关法律法规要求保存，则在该法律法规规定的期限内保存。
        </p>
      </Section>

      <Section title="5. 委托处理及跨境转移">
        <p>本服务将以下处理工作委托给下列公司：</p>
        <div className="mt-3">
          <List>
            <li>
              <strong>Anthropic, PBC</strong>（美国）— 为生成 AI
              评论、每周来信、今日一句、&lsquo;我的思考&rsquo;，用户撰写的记录内容会被发送至该公司。根据
              Anthropic 的商业条款，通过 API 发送的数据默认不用于训练 AI 模型。
            </li>
            <li>
              <strong>Supabase, Inc.</strong> — 数据库存储及登录（身份验证）处理。服务器所在地区：澳大利亚悉尼（AWS
              ap-southeast-2）
            </li>
            <li>
              <strong>Vercel, Inc.</strong>（美国）— 网站托管及服务器运营
            </li>
            <li>
              <strong>Resend</strong>（美国）— 发送登录邮件（电子邮箱地址）
            </li>
          </List>
        </div>
        <p className="mt-3">上述公司依据各自的隐私政策及服务条款处理数据，本服务不要求其用于约定目的以外的用途。</p>
      </Section>

      <Section title="6. 用户的权利及行使方式">
        <p>
          用户可随时要求查阅、更正、删除自己的个人信息或停止处理，也可以通过注销账号删除所有已保存的记录。请通过下方联系方式提出申请。
        </p>
      </Section>

      <Section title="7. 销毁程序及方法">
        <p>保存期限届满或处理目的已实现的个人信息，如为电子文件形式，将以无法恢复的方式立即删除。</p>
      </Section>

      <Section title="8. 安全保障措施">
        <p>
          本服务采用数据库访问控制（行级安全，Row Level Security），用户只能访问自己的记录，无法查看其他用户的记录。未登录状态下无法查看任何记录。
        </p>
        <p className="mt-3">
          <strong>你写下的记录只有你本人能看到，运营者也不会打开记录内容。</strong>
          运营者为运营本服务拥有数据库管理权限，但除用户本人提出要求或同意、或法律法规要求的情况外，不会查阅记录内容。
        </p>
        <p className="mt-3">本服务不会在服务器日志中留存用户的记录内容。</p>
      </Section>

      <Section title="9. 未满 14 岁儿童的使用限制">
        <p>本服务仅供年满 14 岁的用户使用。我们不收集未满 14 岁儿童的个人信息。</p>
      </Section>

      <Section title="10. 个人信息保护负责人及联系方式">
        <List>
          <li>运营者：정수빈</li>
          <li>电子邮箱：jsubini02@naver.com</li>
        </List>
      </Section>

      <Section title="11. 告知义务">
        <p>本政策内容如有变更，将通过本服务内的公告或本页面进行告知。</p>
      </Section>
    </LegalLayout>
  );
}
