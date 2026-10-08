import { ImageResponse } from "next/og";
import type { ProfileItem } from "@/lib/soft-profile";

// 인스타그램 스토리 비율 (9:16)
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

const BRAND = "soft-profile";
const INK = "#1C1B19";
const MUTED = "#8A857C";

// 글꼴 파일이 커서, 카드에 실제로 들어가는 글자만 Google Fonts에서 잘라 받아온다.
async function loadFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error("글꼴을 불러오지 못했습니다.");
  return (await fetch(match[1])).arrayBuffer();
}

/** 항목들을 두 단으로 나눈다. 글자 수가 비슷해지도록 앞에서부터 왼쪽 단을 채운다. */
function splitColumns(items: ProfileItem[]): [ProfileItem[], ProfileItem[]] {
  const weight = (i: ProfileItem) => i.label.length + i.value.length + 12;
  const total = items.reduce((sum, i) => sum + weight(i), 0);
  const left: ProfileItem[] = [];
  let acc = 0;
  for (const item of items) {
    if (left.length > 0 && acc + weight(item) / 2 > total / 2) break;
    left.push(item);
    acc += weight(item);
  }
  return [left, items.slice(left.length)];
}

function Column({
  items,
  labelSize,
  valueSize,
  gap,
}: {
  items: ProfileItem[];
  labelSize: number;
  valueSize: number;
  gap: number;
}) {
  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ fontSize: labelSize, color: MUTED }}>{item.label}</div>
          <div style={{ fontSize: valueSize, lineHeight: 1.45 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function renderProfileCard({
  name,
  headline,
  items,
}: {
  name: string | null;
  headline: string;
  items: ProfileItem[];
}) {
  const footer = "tsotlo.com";
  const koreanText =
    (name ? `${name}의` : "") +
    headline +
    footer +
    items.map((i) => i.label + i.value).join("");

  const [regular, bold, brandItalic] = await Promise.all([
    loadFont("Noto+Sans+KR:wght@400", koreanText),
    loadFont("Noto+Sans+KR:wght@700", koreanText),
    loadFont("Noto+Sans:ital,wght@1,400", BRAND),
  ]);

  const [left, right] = splitColumns(items);

  // 항목이 많으면 글자를 조금 줄여 한 장에 들어가게 한다.
  const dense = items.length > 8;
  const labelSize = dense ? 26 : 28;
  const valueSize = dense ? 34 : 38;
  const itemGap = dense ? 52 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7F5F0",
          padding: "140px 90px 110px",
          fontFamily: "Noto Sans KR",
          color: INK,
          // 한국어가 단어 중간에서 줄바꿈되지 않게
          wordBreak: "keep-all",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: MUTED }}>
          {name && <span>{name}의&nbsp;</span>}
          <span style={{ fontFamily: "Noto Sans", fontStyle: "italic" }}>
            {BRAND}
          </span>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 90,
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Column
            items={left}
            labelSize={labelSize}
            valueSize={valueSize}
            gap={itemGap}
          />
          {/* 가운데 구분선 */}
          <div
            style={{
              width: 2,
              margin: "6px 50px",
              backgroundColor: "#D9D4CA",
            }}
          />
          <Column
            items={right}
            labelSize={labelSize}
            valueSize={valueSize}
            gap={itemGap}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 26, color: "#A8A39A" }}>{footer}</div>
      </div>
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: [
        { name: "Noto Sans KR", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans", data: brandItalic, weight: 400, style: "italic" },
      ],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
