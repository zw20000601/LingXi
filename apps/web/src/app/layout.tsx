import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵析 LingXi",
  description: "视频处理、文档转换、PDF 工具与 API 配置管理平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
