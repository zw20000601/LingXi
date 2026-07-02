"use client";

import { ArrowRight, BookOpen, ChevronDown, ClipboardList, FileQuestion, FileText, LifeBuoy, Mail, MessageCircle, Search, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";

const categories = [
  { title: "新手入门", desc: "了解灵析的基础使用方法", icon: <FileQuestion className="h-7 w-7" /> },
  { title: "常见问题", desc: "解答高频使用问题", icon: <LifeBuoy className="h-7 w-7" /> },
  { title: "功能介绍", desc: "了解各功能详细说明", icon: <ClipboardList className="h-7 w-7" /> },
  { title: "账户安全", desc: "账户安全与隐私保护", icon: <ShieldCheck className="h-7 w-7" /> },
  { title: "更新日志", desc: "查看最新功能更新", icon: <FileText className="h-7 w-7" /> },
];

const faqs = [
  ["灵析支持哪些文件格式？", "目前支持 PDF、Word、Excel、PPT、HTML 以及常见视频链接处理，具体能力取决于后端适配器配置。"],
  ["处理文件的安全性有保障吗？", "文件会按后端过期时间自动清理，建议生产环境开启 HTTPS 和服务端加密存储。"],
  ["转换失败怎么办？", "先查看任务列表中的失败原因，再确认 API 配置、LibreOffice/Poppler 等本地依赖是否已安装。"],
  ["文件处理需要多长时间？", "取决于文件大小和转换类型，任务会在真实任务列表中显示状态。"],
  ["如何联系客服？", "可以通过后台 API 配置里的客服微信号或 SMTP 邮件配置接入真实客服渠道。"],
];

const tutorials = [
  ["PDF转Word教程", "将 PDF 文件转换为可编辑 Word 文档的操作流程"],
  ["视频提取指南", "从视频链接中提交解析任务并查看处理结果"],
  ["文档安全说明", "了解文件上传、过期清理和隐私保护机制"],
  ["OCR文字识别说明", "识别图片或扫描件中的文字内容"],
  ["批量处理建议", "使用任务列表跟踪多个文件的处理状态"],
];

const hotQuestions = ["PDF转Word后格式错乱怎么办？", "如何压缩PDF文件大小？", "视频提取的文件保存在哪里？", "支持哪些视频平台？", "会员功能和普通用户有什么区别？"];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  function search() {
    const text = query.trim();
    setNotice(text ? `已搜索：${text}` : "请输入要搜索的帮助内容");
  }

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#101a35]">
      <SiteHeader active="help" />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_50%,rgba(25,103,255,0.42),transparent_30%),linear-gradient(180deg,#020817_0%,#06266c_100%)]">
        <div className="mx-auto grid h-[190px] max-w-[1380px] grid-cols-[1fr_360px] items-center px-8">
          <div>
            <h1 className="text-[38px] font-black tracking-normal text-white">帮助中心</h1>
            <p className="mt-3 text-[17px] text-blue-100/95">为您提供全面的使用帮助和问题解答。</p>
            <div className="mt-6 flex h-11 max-w-[500px] items-center rounded-lg bg-white p-1 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              <Search className="ml-4 h-5 w-5 text-[#52627f]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#9aa6ba]" placeholder="搜索帮助内容，如 PDF 转 Word" />
              <button onClick={search} className="h-9 w-[78px] rounded-md bg-[#176bff] text-sm font-bold text-white">搜索</button>
            </div>
            {notice ? <div className="mt-3 text-sm font-bold text-blue-100">{notice}</div> : null}
          </div>
          <HeroCube />
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-8 py-5">
        <div className="grid grid-cols-5 gap-4">
          {categories.map((item) => <CategoryCard key={item.title} item={item} onClick={() => setNotice(`已切换到：${item.title}`)} />)}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_450px]">
          <FaqPanel />
          <ContactPanel onNotice={setNotice} />
          <TutorialPanel onNotice={setNotice} />
          <HotPanel />
        </div>
      </section>

      <SiteFooter dark={false} />
    </main>
  );
}

function HeroCube() {
  return (
    <div className="relative h-full">
      <div className="absolute right-[12px] top-[44px] h-[100px] w-[260px] rounded-[50%] border border-[#1f7bff]/25" />
      <div className="absolute right-[84px] top-[28px] h-[88px] w-[88px] rotate-45 rounded-xl bg-gradient-to-br from-[#76b8ff] via-[#2677ff] to-[#0750e6] opacity-95 shadow-[0_22px_48px_rgba(23,107,255,0.48)]" />
      <div className="absolute right-[104px] top-[48px] h-[48px] w-[48px] rotate-45 rounded-lg border border-white/18 bg-white/10" />
      <div className="absolute right-[80px] top-[118px] h-[18px] w-[120px] rounded-[50%] bg-[#176bff]/25 blur-sm" />
    </div>
  );
}

function CategoryCard({ item, onClick }: { item: (typeof categories)[number]; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-[88px] items-center gap-4 rounded-xl border border-[#e2eaf5] bg-white px-6 text-left shadow-[0_12px_30px_rgba(45,83,148,0.08)]"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#176bff]">{item.icon}</span><span><span className="block text-[16px] font-black">{item.title}</span><span className="mt-2 block text-xs text-[#667693]">{item.desc}</span></span></button>;
}

function FaqPanel() {
  const [open, setOpen] = useState(0);
  return <Panel title="常见问题">{faqs.map((faq, index) => <div key={faq[0]} className="mb-2 rounded-md border border-[#e2eaf5]"><button onClick={() => setOpen(open === index ? -1 : index)} className="flex h-9 w-full items-center justify-between px-4 text-left text-sm text-[#52627f]">{faq[0]}<ChevronDown className={`h-4 w-4 transition ${open === index ? "rotate-180" : ""}`} /></button>{open === index ? <div className="px-4 pb-3 text-xs leading-6 text-[#667693]">{faq[1]}</div> : null}</div>)}<MoreButton onClick={() => setOpen(-1)}>收起全部问题</MoreButton></Panel>;
}

function ContactPanel({ onNotice }: { onNotice: (text: string) => void }) {
  return <Panel title="联系客服"><Contact icon={<MessageCircle />} title="在线客服" desc="7x24小时在线服务，快速为您解答" button="立即咨询" tone="green" onClick={() => onNotice("在线客服入口已触发，可继续接入客服系统")} /><Contact icon={<Ticket />} title="提交工单" desc="提交问题工单，技术团队跟进处理" button="去提交" tone="orange" onClick={() => onNotice("工单系统入口已触发，可继续接入工单接口")} /><Contact icon={<Mail />} title="邮件支持" desc="发送邮件至 support@lingxi.com" button="发送邮件" tone="blue" onClick={() => { window.location.href = "mailto:support@lingxi.com"; }} /></Panel>;
}

function TutorialPanel({ onNotice }: { onNotice: (text: string) => void }) {
  return <Panel title="教程与指南">{tutorials.map((item) => <button key={item[0]} onClick={() => onNotice(`打开教程：${item[0]}`)} className="grid w-full grid-cols-[38px_1fr] items-center border-b border-[#eef2f8] py-2 text-left text-sm last:border-0"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#176bff] text-white"><BookOpen className="h-4 w-4" /></span><span><span className="block font-bold">{item[0]}</span><span className="text-xs text-[#667693]">{item[1]}</span></span></button>)}<MoreButton onClick={() => onNotice("已查看全部教程")}>查看全部教程</MoreButton></Panel>;
}

function HotPanel() {
  return <Panel title="热门问题"><ul className="space-y-3 text-sm text-[#52627f]">{hotQuestions.map((q) => <li key={q} className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#176bff]" />{q}</li>)}</ul></Panel>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_30px_rgba(45,83,148,0.08)]"><h2 className="mb-4 text-[18px] font-black">{title}</h2>{children}</section>;
}

function Contact({ icon, title, desc, button, tone, onClick }: { icon: ReactNode; title: string; desc: string; button: string; tone: "green" | "orange" | "blue"; onClick: () => void }) {
  const colors = { green: "text-[#18b878] border-[#18b878]", orange: "text-[#ff741f] border-[#ff741f]", blue: "text-[#176bff] border-[#176bff]" };
  return <div className="mb-3 flex items-center gap-4 rounded-lg border border-[#e2eaf5] p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2f7ff] ${colors[tone].split(" ")[0]}`}>{icon}</span><span className="flex-1"><span className="block font-black">{title}</span><span className="text-xs text-[#667693]">{desc}</span></span><button onClick={onClick} className={`h-8 rounded-md border px-5 text-sm font-bold ${colors[tone]}`}>{button}</button></div>;
}

function MoreButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="mx-auto mt-3 flex w-fit items-center gap-2 text-sm font-bold text-[#176bff]">{children}<ArrowRight className="h-4 w-4" /></button>;
}
