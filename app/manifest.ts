import type { MetadataRoute } from "next";

// 폰에서 "홈 화면에 추가"하면 주소창 없이 앱처럼 열리게 하는 정보
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reactor",
    short_name: "Reactor",
    description: "마음의 기록과 삶의 여행",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#FAFAFA",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
