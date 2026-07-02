"use client";

import {
  ArrowRight,
  Bell,
  CirclePlay,
  Cloud,
  FileImage,
  FileSpreadsheet,
  FileText,
  Layers3,
  Medal,
  MonitorSmartphone,
  Rocket,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./components/SiteHeader";

const tools = [
  { title: "短视频提取", desc: "提取短视频链接", icon: <Video className="h-7 w-7" />, tone: "red", href: "/video-tools" },
  { title: "视频提取文案", desc: "提取视频中的文案", icon: <FileText className="h-7 w-7" />, tone: "purple", href: "/video-tools" },
  { title: "DOC转PDF", desc: "Word文档转PDF", icon: <LetterIcon letter="W" tone="blue" />, tone: "blue", href: "/document-convert" },
  { title: "Excel转PDF", desc: "Excel表格转PDF", icon: <FileSpreadsheet className="h-7 w-7" />, tone: "green", href: "/document-convert" },
  { title: "PDF转Word", desc: "PDF文档转Word", icon: <FileText className="h-7 w-7" />, tone: "orange", href: "/pdf-tools" },
  { title: "PDF转图片", desc: "PDF页面转图片", icon: <FileImage className="h-7 w-7" />, tone: "blue", href: "/pdf-tools" },
];

const advantages = [
  { title: "安全可靠", desc: "文件加密传输与处理，保护隐私与数据安全", icon: <ShieldCheck className="h-8 w-8" />, tone: "blue" },
  { title: "高效快速", desc: "高性能处理引擎，快速完成复杂任务", icon: <Rocket className="h-8 w-8" />, tone: "blue" },
  { title: "功能全面", desc: "覆盖视频、文档、PDF 等多种处理场景", icon: <Layers3 className="h-8 w-8" />, tone: "green" },
  { title: "云端处理", desc: "无需安装软件，随时在线处理文件", icon: <Cloud className="h-8 w-8" />, tone: "purple" },
  { title: "多端适配", desc: "统一的桌面端使用体验和操作流程", icon: <MonitorSmartphone className="h-8 w-8" />, tone: "blue" },
  { title: "专业品质", desc: "稳定、清晰、可持续优化的产品体验", icon: <Medal className="h-8 w-8" />, tone: "orange" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(32,92,210,0.28),transparent_34%),linear-gradient(180deg,#020817_0%,#041435_54%,#05245f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.075)_1px,transparent_1px)] [background-size:34px_34px] opacity-45" />
        <div className="absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-[#020817] via-[#020817]/88 to-transparent" />
        <SiteHeader active="home" blend />
        <HeroArc />

        <div className="relative z-10 mx-auto max-w-[1380px] px-8 pb-8 pt-10">
          <div className="mx-auto max-w-[780px] text-center">
            <h1 className="text-[58px] font-black leading-[1.12] tracking-normal text-white">
              灵析 · 让<span className="mx-2 text-[#2677ff]">效率</span>触手可及
            </h1>
            <p className="mt-4 text-[17px] leading-7 text-[#b6c3dc]">一站式实用工具集合平台，视频处理、文档转换、PDF 工具等全方位满足您的需求</p>
            <div className="mx-auto mt-8 flex h-[54px] max-w-[680px] items-center rounded-2xl border border-white/10 bg-white/[0.1] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur">
              <Search className="ml-4 h-6 w-6 text-[#dce6ff]" />
              <input className="min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder:text-[#a7b3cc]" placeholder="搜索你需要的工具..." />
              <Link href="/features" className="flex h-[44px] w-[94px] items-center justify-center rounded-xl bg-[#2677ff] text-sm font-bold text-white shadow-[0_10px_28px_rgba(38,119,255,0.42)]">
                搜索
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-6 gap-4">
            {tools.map((tool) => <ToolCard key={tool.title} tool={tool} />)}
          </div>
        </div>
      </section>

      <section className="relative z-20 rounded-t-[20px] bg-[#f8fbff] px-8 pb-8 pt-7 text-[#0f1830] shadow-[0_-24px_70px_rgba(255,255,255,0.22)]">
        <div className="mx-auto max-w-[1380px]">
          <div className="text-center">
            <h2 className="text-[26px] font-black tracking-normal">平台优势</h2>
            <p className="mt-2 text-sm text-[#6c7b96]">专业的技术团队，为您提供稳定、高效、安全的服务</p>
          </div>
          <div className="mt-7 grid grid-cols-6 gap-5">
            {advantages.map((item) => <AdvantageCard key={item.title} item={item} />)}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function HeroArc() {
  return (
    <svg className="absolute bottom-[28px] left-[-5%] z-0 h-[270px] w-[110%]" viewBox="0 0 1600 270" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="home-arc-glow-v2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#178bff" stopOpacity="0.96" />
          <stop offset="24%" stopColor="#2484ff" stopOpacity="0.9" />
          <stop offset="49%" stopColor="#2f8dff" stopOpacity="0.76" />
          <stop offset="72%" stopColor="#2177ff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#126cff" stopOpacity="0.05" />
        </linearGradient>
        <filter id="home-arc-blur-v2" x="-12%" y="-180%" width="124%" height="460%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="home-arc-soft-v2" x="-12%" y="-140%" width="124%" height="380%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d="M -70 210 C 92 165 210 138 346 126 C 482 114 610 116 744 118 C 914 121 1055 138 1195 164 C 1338 191 1450 222 1590 278" fill="none" filter="url(#home-arc-blur-v2)" stroke="url(#home-arc-glow-v2)" strokeLinecap="round" strokeWidth="22" />
      <path d="M -70 210 C 92 165 210 138 346 126 C 482 114 610 116 744 118 C 914 121 1055 138 1195 164 C 1338 191 1450 222 1590 278" fill="none" filter="url(#home-arc-soft-v2)" stroke="url(#home-arc-glow-v2)" strokeLinecap="round" strokeWidth="8" />
      <path d="M -70 210 C 92 165 210 138 346 126 C 482 114 610 116 744 118 C 914 121 1055 138 1195 164 C 1338 191 1450 222 1590 278" fill="none" stroke="url(#home-arc-glow-v2)" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function ToolCard({ tool }: { tool: (typeof tools)[number] }) {
  return (
    <Link href={tool.href} className="group flex h-[190px] flex-col justify-between rounded-xl border border-white/10 bg-white/[0.07] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_38px_rgba(0,22,74,0.22)] backdrop-blur transition hover:-translate-y-1 hover:border-[#2677ff]/50">
      <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${toneBg(tool.tone)} text-white shadow-[0_14px_30px_rgba(20,80,190,0.28)]`}>{tool.icon}</span>
      <span>
        <span className="block text-[18px] font-black text-white">{tool.title}</span>
        <span className="mt-2 block text-sm text-[#aebbd5]">{tool.desc}</span>
      </span>
      <ArrowRight className="h-5 w-5 text-white/90 transition group-hover:translate-x-1" />
    </Link>
  );
}

function AdvantageCard({ item }: { item: (typeof advantages)[number] }) {
  return (
    <div className="flex min-h-[168px] flex-col items-center justify-center rounded-lg border border-[#e3e9f4] bg-white px-5 text-center shadow-[0_14px_36px_rgba(37,67,116,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(37,67,116,0.11)]">
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${softTone(item.tone)}`}>{item.icon}</span>
      <h3 className="mt-5 text-[15px] font-black text-[#111b36]">{item.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#697891]">{item.desc}</p>
    </div>
  );
}

function LetterIcon({ letter, tone }: { letter: string; tone: "blue" | "green" | "orange" }) {
  return <span className={`flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br ${tone === "blue" ? "from-[#5ea2ff] to-[#116dff]" : tone === "green" ? "from-[#35c960] to-[#12913c]" : "from-[#ff9b36] to-[#f05b19]"} text-sm font-black text-white`}>{letter}</span>;
}

function toneBg(tone: string) {
  if (tone === "red") return "bg-gradient-to-br from-[#ff6a5f] to-[#e72f3d]";
  if (tone === "purple") return "bg-gradient-to-br from-[#8d66ff] to-[#6934e6]";
  if (tone === "green") return "bg-gradient-to-br from-[#2ec777] to-[#0c9b63]";
  if (tone === "orange") return "bg-gradient-to-br from-[#ff9736] to-[#ec5b18]";
  return "bg-gradient-to-br from-[#388cff] to-[#155de7]";
}

function softTone(tone: string) {
  if (tone === "green") return "bg-[#e9fbf3] text-[#18b878]";
  if (tone === "purple") return "bg-[#f3edff] text-[#8458e9]";
  if (tone === "orange") return "bg-[#fff0e4] text-[#f08322]";
  return "bg-[#edf4ff] text-[#176bff]";
}
