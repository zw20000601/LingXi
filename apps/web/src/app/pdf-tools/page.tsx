"use client";

import { ArrowRight, ChevronDown, FileText, Grid2X2, LockKeyhole, MoreHorizontal, PlusCircle, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { apiJson, downloadFile, formatBytes, type Job } from "@/lib/api";
import { deleteJob, jobStatusClass, jobStatusText, useJobs } from "@/lib/useJobs";
import { SiteHeader } from "../components/SiteHeader";

const tabs = [
  ["PDF转Word", "docx"],
  ["PDF转Excel", "xlsx"],
  ["PDF转PPT", "pptx"],
  ["PDF转图片", "png"],
  ["PDF合并", "pdf"],
  ["PDF拆分", "pdf"],
  ["PDF压缩", "pdf"],
  ["PDF加水印", "pdf"],
  ["OCR识别", "txt"],
  ["更多", "pdf"],
] as const;
const quickTools = ["PDF旋转", "PDF解密", "PDF加密", "页面提取", "页面删除", "图片提取", "PDF转TXT", "PDF转HTML", "PDF/A 转换"];

export default function PdfToolsPage() {
  const { jobs, loading, error, refresh } = useJobs({ types: ["CONVERT"], limit: 50 });
  const [selectedTab, setSelectedTab] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = tabs[selectedTab];
  const pdfJobs = jobs.filter((job) => (job.input_file?.original_name || "").toLowerCase().endsWith(".pdf") || getTarget(job.input).startsWith("pdf"));

  async function startConvert() {
    setMessage("");
    if (!file) {
      setMessage("请先选择 PDF 文件");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("target_format", selected[1]);
      form.append("file", file);
      await apiJson<{ job_id: string; status: string }>("/api/convert/convert", { method: "POST", body: form });
      setMessage("PDF 任务已提交，任务列表会读取真实处理状态");
      setFile(null);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "提交 PDF 任务失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#101a35]">
      <SiteHeader active="pdf" />
      <section className="bg-[linear-gradient(180deg,#020817,#071f5a)]">
        <div className="mx-auto max-w-[1380px] px-8 py-10 text-white">
          <h1 className="text-[38px] font-black tracking-normal">PDF工具</h1>
          <p className="mt-3 text-[16px] text-blue-100/90">强大的 PDF 处理能力，满足各种办公需求。</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1380px] px-8 py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
          <div className="space-y-4">
            <ToolTabs selected={selectedTab} onSelect={setSelectedTab} />
            <UploadPanel file={file} onFile={setFile} selected={selected[0]} target={selected[1]} message={message} submitting={submitting} onStart={startConvert} />
            <TaskList jobs={pdfJobs} loading={loading} error={error} onRefresh={refresh} />
          </div>
          <aside className="space-y-4">
            <GuidePanel />
            <QuickPanel onSelect={(index) => setMessage(`${quickTools[index]} 已选中；对应后端处理接口后续可继续扩展`)} />
            <TrustPanel />
          </aside>
        </div>
      </section>
      <div className="pb-6 text-center text-xs text-[#7a879f]">© 2024 灵析 · 让效率触手可及</div>
    </main>
  );
}

function ToolTabs({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  return <div className="flex h-[60px] items-center gap-2 overflow-x-auto rounded-xl border border-[#e2eaf5] bg-white px-3 shadow-[0_10px_28px_rgba(45,83,148,0.08)]">{tabs.map((tab, i) => <button type="button" key={tab[0]} onClick={() => onSelect(i)} className={`relative flex h-10 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-bold ${i === selected ? "bg-[#eef4ff] text-[#176bff]" : "text-[#263451]"}`}>{i < 9 ? <FileText className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}{tab[0]}{i === selected ? <span className="absolute -bottom-[10px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-[#eef4ff]" /> : null}</button>)}</div>;
}

function UploadPanel({ file, onFile, selected, target, message, submitting, onStart }: { file: File | null; onFile: (file: File | null) => void; selected: string; target: string; message: string; submitting: boolean; onStart: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) onFile(dropped);
  }
  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]">
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex h-[238px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b8cef2] outline-none transition hover:border-[#176bff] focus:ring-4 focus:ring-blue-50"
        aria-label="上传 PDF 文件"
      >
        <div className="relative"><FileText className="h-16 w-16 text-[#b9cef5]" /><PlusCircle className="absolute bottom-0 right-0 h-7 w-7 fill-[#176bff] text-white" /></div>
        <div className="mt-4 text-[15px] font-black">点击或拖拽文件到此处上传</div>
        <div className="mt-2 text-sm text-[#667693]">{file ? file.name : "支持 PDF 格式，文件大小不超过 100MB"}</div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }} className="h-11 w-[150px] rounded-md bg-[#176bff] text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,107,255,0.26)]">选择文件</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onStart(); }} disabled={submitting} className="h-11 w-[150px] rounded-md border border-[#176bff] text-sm font-bold text-[#176bff] disabled:opacity-60">{submitting ? "提交中..." : "开始处理"}</button>
        </div>
        <div className="mt-4 text-sm text-[#9aa6ba]">当前工具：{selected}</div>
      </div>
      <div className="mt-4 flex h-[52px] items-center gap-8 overflow-x-auto rounded-lg border border-[#e7edf7] px-4 text-sm">
        <span className="font-black">转换设置</span><span>输出格式：<b className="text-[#176bff]">{target.toUpperCase()}</b></span><Select>识别模式：智能识别（推荐）</Select><Select>页面范围：全部页面</Select><span>OCR 识别（识别图片中的文字）</span>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-[#176bff]">{message}</div> : null}
    </section>
  );
}

function TaskList({ jobs, loading, error, onRefresh }: { jobs: Job[]; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]">
      <div className="flex items-center justify-between"><h2 className="text-[18px] font-black">任务列表</h2><button type="button" onClick={onRefresh} className="rounded-md border border-[#dbe5f2] px-3 py-1 text-sm text-[#667693]"><RefreshCw className="mr-1 inline h-4 w-4" />刷新</button></div>
      <div className="mt-4 flex gap-8 border-b border-[#e5ebf5] text-sm font-bold text-[#667693]"><span className="border-b-2 border-[#176bff] pb-3 text-[#176bff]">全部任务</span><span>处理中</span><span>转换完成</span><span>转换失败</span></div>
      <div className="grid grid-cols-[1.4fr_0.8fr_0.55fr_1fr_1.1fr_0.7fr] border-b border-[#e5ebf5] px-3 py-3 text-sm text-[#667693]">{["文件名称", "工具", "大小", "状态", "创建时间", "操作"].map((h) => <span key={h}>{h}</span>)}</div>
      {error ? <EmptyState text={error} /> : loading ? <EmptyState text="正在读取真实任务..." /> : jobs.length ? jobs.map((job) => <TaskRow key={job.id} job={job} onRefresh={onRefresh} />) : <EmptyState text="暂无真实 PDF 任务" />}
      <button type="button" onClick={onRefresh} className="mx-auto mt-4 flex w-fit items-center gap-2 text-sm font-bold text-[#176bff]">查看更多任务记录 <ArrowRight className="h-4 w-4" /></button>
    </section>
  );
}

function GuidePanel() {
  const steps = [["1. 选择工具", "选择上方需要的 PDF 处理工具"], ["2. 上传文件", "点击上传或拖拽 PDF 文件到上传区域"], ["3. 设置选项", "根据需求设置转换选项和参数"], ["4. 开始处理", "点击开始处理，等待任务完成"], ["5. 下载文件", "处理完成后下载文件到本地"]];
  return <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]"><h2 className="text-[18px] font-black">使用说明</h2><div className="mt-4 space-y-4">{steps.map(([title, desc]) => <div key={title} className="flex gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#176bff]"><Grid2X2 className="h-4 w-4" /></span><span><span className="block text-sm font-black">{title}</span><span className="text-xs text-[#667693]">{desc}</span></span></div>)}</div></section>;
}

function QuickPanel({ onSelect }: { onSelect: (index: number) => void }) {
  return <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]"><h2 className="text-[18px] font-black">更多 PDF 快捷工具</h2><div className="mt-4 grid grid-cols-3 gap-2">{quickTools.map((tool, index) => <button type="button" key={tool} onClick={() => onSelect(index)} className="flex h-[78px] flex-col items-center justify-center rounded-lg border border-[#e5ebf5] text-center text-xs font-bold"><FileText className="mb-2 h-5 w-5 text-[#176bff]" />{tool}<span className="mt-1 text-[10px] font-normal text-[#667693]">快捷处理</span></button>)}</div><button type="button" onClick={() => onSelect(0)} className="mx-auto mt-4 flex w-fit items-center gap-2 text-sm font-bold text-[#176bff]">查看更多工具 <ArrowRight className="h-4 w-4" /></button></section>;
}

function TrustPanel() {
  return <section className="grid grid-cols-3 rounded-xl border border-[#e2eaf5] bg-white p-5 text-center shadow-[0_12px_34px_rgba(45,83,148,0.08)]"><Trust icon={<ShieldCheck />} title="安全可靠" desc="文件加密传输" /><Trust icon={<RefreshCw />} title="快速高效" desc="专业队列处理" /><Trust icon={<LockKeyhole />} title="隐私保护" desc="不保留文件内容" /></section>;
}

function TaskRow({ job, onRefresh }: { job: Job; onRefresh: () => void }) {
  async function handleAction() {
    if (job.status === "SUCCEEDED" && job.output_file?.id) return downloadFile(`/api/files/${job.output_file.id}/download`);
    await deleteJob(job.id);
    await onRefresh();
  }
  return (
    <div className="grid grid-cols-[1.4fr_0.8fr_0.55fr_1fr_1.1fr_0.7fr] items-center border-b border-[#eef2f8] px-3 py-3 text-sm text-[#52627f]">
      <span className="flex items-center gap-2 font-bold text-[#17203c]"><FileText className="h-4 w-4 text-[#ef3340]" />{job.input_file?.original_name || job.id}</span>
      <span>{toolName(job)}</span>
      <span>{formatBytes(job.input_file?.size_bytes)}</span>
      <span><span className={`rounded-full px-3 py-1 text-xs font-bold ${jobStatusClass(job.status)}`}>{jobStatusText(job.status)}</span></span>
      <span>{formatDate(job.created_at)}</span>
      <button type="button" onClick={() => void handleAction()} className="flex gap-3 text-[#176bff]">{job.status === "SUCCEEDED" ? "下载文件" : "删除"}<Trash2 className="h-4 w-4 text-[#667693]" /></button>
    </div>
  );
}

function Select({ children }: { children: ReactNode }) { return <span className="flex shrink-0 items-center gap-2 rounded-md border border-[#dbe5f2] px-3 py-1 text-[#52627f]">{children}<ChevronDown className="h-4 w-4" /></span>; }
function Trust({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) { return <div><span className="mx-auto flex h-9 w-9 items-center justify-center text-[#176bff]">{icon}</span><div className="mt-2 text-sm font-black">{title}</div><div className="mt-1 text-xs text-[#667693]">{desc}</div></div>; }
function EmptyState({ text }: { text: string }) { return <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-[#dbe5f2] text-sm font-bold text-[#667693]">{text}</div>; }
function getTarget(input: unknown) { if (!input || typeof input !== "object") return ""; const target = (input as { target_format?: unknown }).target_format; return typeof target === "string" ? target.toLowerCase() : ""; }
function toolName(job: Job) { const target = getTarget(job.input); if (!target) return "PDF处理"; return `转为 ${target.toUpperCase()}`; }
function formatDate(value?: string) { if (!value) return "-"; return new Date(value).toLocaleString("zh-CN", { hour12: false }); }
