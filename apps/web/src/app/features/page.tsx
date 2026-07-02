"use client";

import {
  ArrowRight,
  Box,
  Code2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Flame,
  Layers3,
  LayoutGrid,
  PlaySquare,
  Search,
  Shield,
  ShieldCheck,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";

const stats = [
  { value: "40+", label: "实用工具", desc: "持续更新中", icon: Box, tone: "blue" },
  { value: "20+", label: "支持格式", desc: "覆盖主流类型", icon: Layers3, tone: "green" },
  { value: "120万+", label: "日处理任务", desc: "高效稳定运行", icon: Zap, tone: "purple" },
  { value: "99.9%", label: "处理成功率", desc: "数据安全可靠", icon: ShieldCheck, tone: "orange" },
];

const sections = [
  {
    id: "video",
    title: "视频工具",
    icon: <Video className="h-4 w-4" />,
    href: "/video-tools",
    cards: [
      { title: "短视频提取", desc: "支持主流平台视频提取，一键保存高清视频", icon: <Video className="h-7 w-7" /> },
      { title: "视频提取文案", desc: "提取视频文案/字幕，支持多语言识别", icon: <FileText className="h-7 w-7" /> },
    ],
  },
  {
    id: "document",
    title: "文档转换",
    icon: <LetterIcon letter="W" tone="blue" small />,
    href: "/document-convert",
    cards: [
      { title: "DOC转PDF", desc: "Word文档转PDF，保留格式与排版", icon: <LetterIcon letter="W" tone="blue" /> },
      { title: "Excel转PDF", desc: "Excel表格转PDF，清晰呈现表格内容", icon: <LetterIcon letter="X" tone="green" /> },
      { title: "PPT转PDF", desc: "PPT演示文稿转PDF，方便分享与打印", icon: <LetterIcon letter="P" tone="orange" /> },
      { title: "文档互转", desc: "支持 PDF 与 Word、Excel、PPT 等多种格式互转", icon: <FormatCluster /> },
    ],
  },
  {
    id: "pdf",
    title: "PDF工具",
    icon: <LetterIcon letter="P" tone="purple" small />,
    href: "/pdf-tools",
    cards: [
      { title: "HTML转PDF", desc: "网页文件转PDF，完整保留网页结构", icon: <Code2 className="h-7 w-7" /> },
      { title: "PDF转Word", desc: "PDF转为可编辑Word，精准还原内容", icon: <FileText className="h-7 w-7" /> },
      { title: "PDF转Excel", desc: "PDF转为Excel表格，数据提取更高效", icon: <FileSpreadsheet className="h-7 w-7" /> },
      { title: "PDF转PPT", desc: "PDF转为PPT演示文稿，快速生成演示材料", icon: <PlaySquare className="h-7 w-7" /> },
      { title: "PDF转图片", desc: "PDF每页转为图片，支持多种图片格式", icon: <FileImage className="h-7 w-7" /> },
    ],
  },
];

const advantages = [
  { title: "安全可靠", desc: "文件加密传输，处理后按策略清理", icon: Shield },
  { title: "高效快速", desc: "智能处理引擎，节省等待时间", icon: Zap },
  { title: "批量处理", desc: "支持批量上传，一次处理多个文件", icon: Layers3 },
  { title: "多格式支持", desc: "覆盖常用办公与媒体格式", icon: LayoutGrid },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#0b1736]">
      <SiteHeader active="features" />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_20%,rgba(30,111,255,0.42),transparent_30%),linear-gradient(180deg,#020817_0%,#061a52_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px] opacity-50" />
        <div className="mx-auto grid max-w-[1380px] grid-cols-[420px_1fr] items-center gap-12 px-8 pb-[92px] pt-12">
          <div className="relative z-10">
            <h1 className="text-[56px] font-black leading-[1.05] tracking-normal text-white">全部功能</h1>
            <p className="mt-7 max-w-[450px] text-[17px] leading-8 text-blue-100/90">
              灵析功能中心集合视频处理、文档转换、PDF 工具等实用能力，高效处理各类文件，满足你的多样化需求。
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-4 rounded-[20px] border border-white/12 bg-white/[0.06] px-8 py-8 shadow-[0_24px_80px_rgba(0,44,146,0.28)] backdrop-blur-xl">
            {stats.map((stat, index) => <StatItem key={stat.label} item={stat} divided={index > 0} />)}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-[#f7fbff] via-[#f7fbff]/70 to-transparent" />
      </section>

      <section className="relative z-20 mx-auto -mt-[64px] max-w-[1380px] px-8 pb-8">
        <div className="rounded-[18px] border border-white bg-white/92 p-4 shadow-[0_22px_70px_rgba(44,88,149,0.18)] backdrop-blur">
          <div className="flex items-center gap-4">
            <label className="flex h-[54px] min-w-[420px] flex-1 items-center gap-3 rounded-full border border-[#dbe5f2] bg-white px-5 text-sm text-[#8b9ab3]">
              <Search className="h-5 w-5 text-[#53627f]" />
              <input className="w-full bg-transparent outline-none placeholder:text-[#8b9ab3]" placeholder="搜索工具，例如：PDF转Word" />
            </label>
            {["全部", "视频工具", "文档转换", "PDF工具"].map((item, index) => (
              <a key={item} href={index === 0 ? "#video" : index === 1 ? "#video" : index === 2 ? "#document" : "#pdf"} className={`flex h-[42px] min-w-[92px] items-center justify-center rounded-full border px-6 text-sm font-semibold ${index === 0 ? "border-[#1677ff] bg-[#1677ff] text-white shadow-[0_12px_28px_rgba(22,119,255,0.24)]" : "border-[#dfe7f3] bg-[#f8fbff] text-[#2e3853]"}`}>
                {item}
              </a>
            ))}
            <span className="flex h-[42px] items-center gap-2 rounded-full border border-[#dfe7f3] bg-[#f8fbff] px-6 text-sm font-semibold text-[#2e3853]"><Flame className="h-4 w-4 fill-orange-500 text-orange-500" />热门</span>
          </div>
        </div>

        {sections.map((section) => (
          <section id={section.id} key={section.id} className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1d72ff] text-white shadow-[0_7px_16px_rgba(29,114,255,0.32)]">{section.icon}</span>
                <h2 className="text-[20px] font-black text-[#101a35]">{section.title}</h2>
              </div>
              <Link href={section.href} className="flex items-center gap-2 text-sm font-black text-[#176bff]">进入工作台 <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className={`grid gap-4 ${section.cards.length === 2 ? "grid-cols-2" : section.cards.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
              {section.cards.map((card) => <ToolTile key={card.title} card={card} href={section.href} />)}
            </div>
          </section>
        ))}

        <div className="mt-5 grid grid-cols-4 gap-4">
          {advantages.map((item) => <AdvantageCard key={item.title} item={item} />)}
        </div>
      </section>

      <SiteFooter dark={false} />
    </main>
  );
}

function StatItem({ item, divided }: { item: (typeof stats)[number]; divided: boolean }) {
  const Icon = item.icon;
  return (
    <div className={`flex items-center gap-5 ${divided ? "border-l border-white/10 pl-8" : ""}`}>
      <div className={`stat-icon stat-${item.tone}`}><Icon className="h-8 w-8" /></div>
      <div>
        <div className="whitespace-nowrap text-[26px] font-black leading-none text-white">{item.value}</div>
        <div className="mt-3 text-[15px] font-semibold text-white">{item.label}</div>
        <div className="mt-3 text-[13px] text-blue-100/80">{item.desc}</div>
      </div>
    </div>
  );
}

function ToolTile({ card, href }: { card: { title: string; desc: string; icon: ReactNode }; href: string }) {
  return (
    <Link href={href} className="group relative flex h-[126px] items-center gap-5 rounded-xl border border-[#e4ebf5] bg-white px-5 pr-9 text-left shadow-[0_10px_30px_rgba(59,91,142,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(59,91,142,0.12)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7e2dff] to-[#5915d8] text-white shadow-[0_12px_24px_rgba(99,37,214,0.26)]">{card.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block whitespace-nowrap text-[15px] font-black text-[#17203c]">{card.title}</span>
        <span className="mt-2 block text-[12px] leading-5 text-[#7c8aa5]">{card.desc}</span>
      </span>
      <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[#8290aa] transition group-hover:translate-x-1" />
    </Link>
  );
}

function AdvantageCard({ item }: { item: { title: string; desc: string; icon: ComponentType<{ className?: string }> } }) {
  const Icon = item.icon;
  return (
    <div className="flex min-h-[108px] items-center gap-5 rounded-xl border border-[#e4ebf5] bg-white px-8 shadow-[0_12px_34px_rgba(59,91,142,0.08)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f5fb] text-[#1d6fee]"><Icon className="h-8 w-8" /></span>
      <span><span className="block text-[17px] font-black text-[#17203c]">{item.title}</span><span className="mt-2 block text-[13px] leading-5 text-[#73839f]">{item.desc}</span></span>
    </div>
  );
}

function LetterIcon({ letter, tone, small = false }: { letter: string; tone: "blue" | "green" | "orange" | "purple"; small?: boolean }) {
  const styles = { blue: "from-[#2a8cff] to-[#075bdc]", green: "from-[#35c960] to-[#12913c]", orange: "from-[#ff8c25] to-[#eb5314]", purple: "from-[#8f36ff] to-[#6215d8]" };
  return <span className={`flex ${small ? "h-4 w-4 rounded text-[10px]" : "h-12 w-12 rounded-lg text-lg"} items-center justify-center bg-gradient-to-br ${styles[tone]} font-black text-white`}>{letter}</span>;
}

function FormatCluster() {
  return (
    <span className="grid grid-cols-2 gap-1">
      <LetterIcon letter="W" tone="blue" small />
      <LetterIcon letter="X" tone="green" small />
      <LetterIcon letter="P" tone="orange" small />
      <span className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-[#ff4949] to-[#dc1d1d] text-[7px] font-black text-white">PDF</span>
    </span>
  );
}
