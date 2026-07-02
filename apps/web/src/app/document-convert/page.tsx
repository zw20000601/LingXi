"use client";

import { ArrowDownToLine, ArrowRight, CheckCircle2, ChevronDown, Code2, FileText, Grid2X2, LockKeyhole, Settings, UploadCloud, UsersRound } from "lucide-react";
import { useRef, useState } from "react";
import { apiJson, downloadFile, formatBytes, type Job } from "@/lib/api";
import { deleteJob, jobStatusClass, jobStatusText, useJobs } from "@/lib/useJobs";
import { SiteHeader } from "../components/SiteHeader";

const commonTools = [
  ["DOC转PDF", "pdf", "W", "blue"],
  ["Excel转PDF", "pdf", "X", "green"],
  ["PPT转PDF", "pdf", "P", "orange"],
  ["HTML转PDF", "pdf", "code", "blue"],
  ["PDF转Word", "docx", "W", "blue"],
  ["PDF转Excel", "xlsx", "X", "green"],
  ["PDF转PPT", "pptx", "P", "orange"],
  ["更多", "pdf", "grid", "slate"],
] as const;

const advantages = [
  { title: "多格式支持", desc: "支持 Word、Excel、PPT、PDF、HTML 等格式互转", icon: <Grid2X2 className="h-7 w-7" /> },
  { title: "高质量转换", desc: "尽量保留原文档排版、格式和样式", icon: <Settings className="h-7 w-7" /> },
  { title: "安全可靠", desc: "文件传输加密，按过期策略自动清理", icon: <LockKeyhole className="h-7 w-7" /> },
  { title: "基础免费", desc: "基础转换能力可直接使用", icon: <UsersRound className="h-7 w-7" /> },
];

export default function DocumentConvertPage() {
  const { jobs, loading, error, refresh } = useJobs({ types: ["CONVERT"], limit: 50 });
  const [selectedTool, setSelectedTool] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = commonTools[selectedTool];

  async function startConvert() {
    setMessage("");
    if (!file) {
      setMessage("请先选择要转换的文件");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("target_format", selected[1]);
      form.append("file", file);
      await apiJson<{ job_id: string; status: string }>("/api/convert/convert", { method: "POST", body: form });
      setMessage("转换任务已提交，任务列表会读取真实处理状态");
      setFile(null);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "提交转换失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] text-[#101a35]">
      <SiteHeader active="document" />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_34%,rgba(28,111,255,0.34),transparent_28%),linear-gradient(180deg,#031436_0%,#07266c_100%)]">
        <div className="mx-auto grid h-[190px] max-w-[1380px] grid-cols-[1fr_360px] items-center px-8 text-white">
          <div>
            <h1 className="text-[42px] font-black tracking-normal">文档转换</h1>
            <p className="mt-4 text-[17px] text-blue-100/95">支持多种格式文档互转，快速高效，安全可靠。</p>
          </div>
          <div className="relative h-full">
            <div className="absolute right-0 top-8 h-[116px] w-[260px] rounded-[50%] border border-[#1f7bff]/45" />
            <div className="absolute right-[74px] top-10 flex h-[96px] w-[96px] rotate-[4deg] items-center justify-center rounded-2xl bg-white/10 shadow-[0_20px_42px_rgba(20,103,232,0.45)] backdrop-blur"><FileText className="h-14 w-14 text-white" /></div>
            <div className="absolute right-[32px] top-11 h-[84px] w-[84px] rounded-xl bg-[#176bff]/35" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-8 py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_14px_34px_rgba(45,83,148,0.08)]">
            <UploadBox file={file} onFile={setFile} />
            <h2 className="mt-6 text-sm font-black">常用转换</h2>
            <div className="mt-3 grid grid-cols-8 gap-2">
              {commonTools.map((tool, index) => <ToolButton key={tool[0]} tool={tool} active={index === selectedTool} onClick={() => setSelectedTool(index)} />)}
            </div>
            {message ? <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-[#176bff]">{message}</div> : null}
          </div>
          <SettingsPanel selectedName={selected[0]} targetFormat={selected[1]} onStart={startConvert} submitting={submitting} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.58fr_0.42fr]">
          <TaskPanel jobs={jobs} loading={loading} error={error} onRefresh={refresh} />
          <RecentPanel jobs={jobs} loading={loading} error={error} />
        </div>

        <section className="mt-4 rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_14px_34px_rgba(45,83,148,0.08)]">
          <h2 className="text-[18px] font-black">选择灵析文档转换的优势</h2>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {advantages.map((item) => <Advantage key={item.title} item={item} />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function UploadBox({ file, onFile }: { file: File | null; onFile: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[#b8cef2] bg-white">
      <input ref={inputRef} type="file" className="hidden" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
      <UploadCloud className="h-12 w-12 text-[#7ca2ec]" />
      <div className="mt-3 text-[15px] font-black">点击或拖拽文件到此处上传</div>
      <div className="mt-2 text-sm text-[#667693]">{file ? file.name : "支持 PDF、Word、Excel、PPT、HTML 等格式"}</div>
      <button onClick={() => inputRef.current?.click()} className="mt-4 h-10 w-[138px] rounded-md bg-[#176bff] text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,107,255,0.26)]">选择文件</button>
    </div>
  );
}

function SettingsPanel({ selectedName, targetFormat, onStart, submitting }: { selectedName: string; targetFormat: string; onStart: () => void; submitting: boolean }) {
  return (
    <aside className="rounded-xl border border-[#e2eaf5] bg-white p-6 shadow-[0_14px_34px_rgba(45,83,148,0.08)]">
      <h2 className="text-[18px] font-black">转换设置</h2>
      <Select label="转换模式" value={selectedName} />
      <Select label="输出格式" value={targetFormat.toUpperCase()} />
      <div className="mt-5 text-sm font-bold">页面设置</div>
      <Radio checked label="全部页面" />
      <Radio label="指定页码" input="例如：1,3-5,8" />
      <div className="mt-5 text-sm font-bold">其他设置</div>
      <Check label="OCR 识别（识别图片中的文字）" />
      <Check checked label="合并所有页面为一个文件" />
      <button onClick={onStart} disabled={submitting} className="mt-6 h-11 w-full rounded-lg bg-[#176bff] text-base font-black text-white shadow-[0_10px_24px_rgba(23,107,255,0.24)] disabled:opacity-60">{submitting ? "提交中..." : "开始转换"}</button>
    </aside>
  );
}

function TaskPanel({ jobs, loading, error, onRefresh }: { jobs: Job[]; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-4 shadow-[0_12px_30px_rgba(45,83,148,0.08)]">
      <div className="flex items-center justify-between"><h2 className="text-[17px] font-black">转换任务进度</h2><button onClick={onRefresh} className="text-sm font-bold text-[#176bff]">刷新</button></div>
      <div className="mt-3 space-y-2">{error ? <EmptyState text={error} /> : loading ? <EmptyState text="正在读取真实任务..." /> : jobs.length ? jobs.map((job) => <TaskRow key={job.id} job={job} onRefresh={onRefresh} />) : <EmptyState text="暂无真实转换任务" />}</div>
      <button onClick={onRefresh} className="mx-auto mt-4 flex w-fit items-center gap-2 text-sm font-bold text-[#176bff]">查看全部任务 <ArrowRight className="h-4 w-4" /></button>
    </section>
  );
}

function RecentPanel({ jobs, loading, error }: { jobs: Job[]; loading: boolean; error: string }) {
  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-4 shadow-[0_12px_30px_rgba(45,83,148,0.08)]">
      <h2 className="text-[17px] font-black">最近转换记录</h2>
      <div className="mt-3 space-y-2">{error ? <EmptyState text={error} /> : loading ? <EmptyState text="正在读取真实记录..." /> : jobs.length ? jobs.slice(0, 6).map((job) => <RecentRow key={job.id} job={job} />) : <EmptyState text="暂无真实转换记录" />}</div>
    </section>
  );
}

function ToolButton({ tool, active, onClick }: { tool: (typeof commonTools)[number]; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex h-[50px] items-center justify-center gap-2 rounded-md border text-xs font-black ${active ? "border-[#176bff] text-[#176bff]" : "border-[#e2eaf5] text-[#1d2945]"}`}><DocIcon type={tool[2]} tone={tool[3]} />{tool[0]}</button>;
}

function TaskRow({ job, onRefresh }: { job: Job; onRefresh: () => void }) {
  async function handleAction() {
    if (job.status === "SUCCEEDED" && job.output_file?.id) return downloadFile(`/api/files/${job.output_file.id}/download`);
    await deleteJob(job.id);
    await onRefresh();
  }
  return (
    <div className="grid grid-cols-[1.5fr_0.7fr_1fr_0.7fr_0.5fr] items-center rounded-lg border border-[#e5ebf5] px-3 py-2 text-sm text-[#53627f]">
      <span className="flex items-center gap-2 font-bold text-[#17203c]"><DocIcon type={docIcon(job)} tone={docTone(job)} />{job.input_file?.original_name || job.id}</span>
      <span>{formatBytes(job.input_file?.size_bytes)}</span>
      <span><span className={`rounded-full px-3 py-1 text-xs font-bold ${jobStatusClass(job.status)}`}>{jobStatusText(job.status)}</span></span>
      <span>{formatDate(job.created_at)}</span>
      <button onClick={() => void handleAction()} className="justify-self-end rounded-md border border-[#dfe7f3] px-3 py-1 text-[#176bff]">{job.status === "SUCCEEDED" ? "下载" : "删除"}</button>
    </div>
  );
}

function RecentRow({ job }: { job: Job }) {
  return <div className="grid grid-cols-[1fr_82px_34px] items-center rounded-lg border border-[#e5ebf5] px-3 py-2 text-sm"><span className="flex items-center gap-2"><DocIcon type={docIcon(job)} tone={docTone(job)} /><span><span className="block font-bold text-[#17203c]">{job.input_file?.original_name || job.id}</span><span className="text-xs text-[#667693]">{getTarget(job.input).toUpperCase() || "转换"} · {formatBytes(job.input_file?.size_bytes)}</span></span></span><span className="text-xs text-[#667693]">{formatDate(job.created_at)}</span><ArrowDownToLine className="h-4 w-4 text-[#176bff]" /></div>;
}

function Advantage({ item }: { item: (typeof advantages)[number] }) {
  return <div className="flex min-h-[104px] items-center gap-4 rounded-lg border border-[#e5ebf5] px-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#176bff]">{item.icon}</span><span><span className="block text-sm font-black">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[#667693]">{item.desc}</span></span></div>;
}

function Select({ label, value }: { label: string; value: string }) {
  return <label className="mt-5 block text-sm"><span className="font-bold text-[#53627f]">{label}</span><span className="mt-2 flex h-10 items-center justify-between rounded-md border border-[#dbe5f2] px-3">{value}<ChevronDown className="h-4 w-4" /></span></label>;
}
function Radio({ label, checked = false, input }: { label: string; checked?: boolean; input?: string }) {
  return <label className="mt-3 flex items-center gap-3 text-sm text-[#53627f]"><span className={`h-4 w-4 rounded-full border ${checked ? "border-[#176bff] bg-[#176bff]" : "border-[#cbd6e8]"}`} />{label}{input ? <span className="ml-auto flex h-8 w-[190px] items-center rounded-md border border-[#dbe5f2] px-3 text-xs text-[#a0abc0]">{input}</span> : null}</label>;
}
function Check({ label, checked = false }: { label: string; checked?: boolean }) {
  return <label className="mt-3 flex items-center gap-3 text-sm text-[#53627f]"><span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-[#176bff] bg-[#176bff] text-white" : "border-[#cbd6e8]"}`}>{checked ? <CheckCircle2 className="h-3 w-3" /> : null}</span>{label}</label>;
}
function DocIcon({ type, tone }: { type: string; tone: string }) {
  if (type === "code") return <Code2 className="h-5 w-5 text-[#176bff]" />;
  if (type === "grid") return <Grid2X2 className="h-5 w-5 text-[#667693]" />;
  const colors: Record<string, string> = { blue: "bg-[#176bff]", green: "bg-[#18b878]", orange: "bg-[#ff741f]", red: "bg-[#ef3340]", slate: "bg-[#667693]" };
  return <span className={`flex h-5 w-5 items-center justify-center rounded ${colors[tone]} text-[10px] font-black text-white`}>{type}</span>;
}
function EmptyState({ text }: { text: string }) { return <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[#dbe5f2] text-sm font-bold text-[#667693]">{text}</div>; }
function getTarget(input: unknown) { if (!input || typeof input !== "object") return ""; const target = (input as { target_format?: unknown }).target_format; return typeof target === "string" ? target.toLowerCase() : ""; }
function docIcon(job: Job) { const name = (job.input_file?.original_name || "").toLowerCase(); if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "X"; if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "P"; if (name.endsWith(".html") || name.endsWith(".htm")) return "code"; return "W"; }
function docTone(job: Job) { const icon = docIcon(job); if (icon === "X") return "green"; if (icon === "P") return "orange"; return "blue"; }
function formatDate(value?: string) { if (!value) return "-"; return new Date(value).toLocaleString("zh-CN", { hour12: false }); }
