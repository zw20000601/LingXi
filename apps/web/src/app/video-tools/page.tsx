"use client";

import { ArrowDownToLine, ArrowRight, CheckCircle2, Copy, FileText, Link2, Play, RefreshCw, Trash2, Video, X } from "lucide-react";
import { useState } from "react";
import { apiJson, detectPlatform, downloadFile, formatBytes, type Job } from "@/lib/api";
import { deleteJob, jobStatusClass, jobStatusText, useJobs } from "@/lib/useJobs";
import { SiteHeader } from "../components/SiteHeader";

const platforms = [
  ["YouTube", "YT", "bg-[#ff1919] text-white"],
  ["抖音", "抖", "bg-black text-white"],
  ["哔哩哔哩", "B", "bg-[#fb7299] text-white"],
  ["微博", "微", "bg-[#ff8200] text-white"],
  ["小红书", "RED", "bg-[#ff2442] text-white text-[9px]"],
  ["Twitter", "T", "bg-[#1da1f2] text-white"],
  ["Facebook", "F", "bg-[#1877f2] text-white"],
  ["更多", "...", "bg-[#eef4ff] text-[#52627f]"],
];

export default function VideoToolsPage() {
  const { jobs, loading, error, refresh } = useJobs({ types: ["VIDEO_PARSE", "VIDEO_TRANSCRIBE"], limit: 50 });
  const latestResult = jobs.find((job) => job.status === "SUCCEEDED" && job.result) ?? null;

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#101a35]">
      <SiteHeader active="video" />
      <section className="bg-[linear-gradient(180deg,#020817,#071f5a)]">
        <div className="mx-auto max-w-[1380px] px-8 py-10 text-white">
          <h1 className="text-[38px] font-black tracking-normal">视频工具</h1>
          <p className="mt-3 text-[17px] text-blue-100/90">从主流平台提取视频、音频、文案或字幕，支持多种格式与分辨率。</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1380px] px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ParserPanel onCreated={refresh} />
          <ResultPanel job={latestResult} loading={loading} />
        </div>
        <RecentTasks jobs={jobs} loading={loading} error={error} onRefresh={refresh} />
      </section>
      <div className="pb-6 text-center text-xs text-[#7a879f]">© 2024 灵析 · 让效率触手可及</div>
    </main>
  );
}

function ParserPanel({ onCreated }: { onCreated: () => void }) {
  const [mode, setMode] = useState<"parse" | "transcribe">("parse");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    if (!url.trim()) {
      setMessage("请输入视频链接");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "parse") {
        await apiJson<{ job_id: string; status: string }>("/api/video/parse", {
          method: "POST",
          body: JSON.stringify({ url: url.trim(), platform: detectPlatform(url) }),
        });
      } else {
        const form = new FormData();
        form.append("source_url", url.trim());
        await apiJson<{ job_id: string; status: string }>("/api/video/transcribe", { method: "POST", body: form });
      }
      setMessage("任务已提交，处理完成后会出现在真实任务列表中");
      onCreated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]">
      <div className="inline-flex rounded-lg bg-[#f0f4fb] p-0.5">
        <button type="button" onClick={() => setMode("parse")} className={`flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-md px-5 text-sm font-black ${mode === "parse" ? "bg-white text-[#176bff] shadow-sm" : "text-[#52627f]"}`}><Video className="h-4 w-4" />视频提取</button>
        <button type="button" onClick={() => setMode("transcribe")} className={`flex h-10 min-w-[170px] items-center justify-center gap-2 rounded-md px-5 text-sm font-black ${mode === "transcribe" ? "bg-white text-[#176bff] shadow-sm" : "text-[#52627f]"}`}><FileText className="h-4 w-4" />文案字幕提取</button>
      </div>
      <h2 className="mt-6 text-sm font-black">视频链接</h2>
      <div className="mt-3 flex h-11 items-center gap-3 rounded-lg border border-[#dbe5f2] px-4 text-[#71809b]">
        <Link2 className="h-5 w-5 text-[#176bff]" />
        <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#93a0b9]" placeholder="请输入视频链接，例如：https://www.example.com/watch?v=xxxx" value={url} onChange={(event) => setUrl(event.target.value)} />
        {url ? <button type="button" onClick={() => setUrl("")} aria-label="清空链接"><X className="h-4 w-4 text-[#a7b2c6]" /></button> : null}
      </div>
      <p className="mt-3 text-sm text-[#667693]">支持复制链接或粘贴分享链接。</p>
      <button type="button" onClick={submit} disabled={submitting} className="mt-5 h-11 w-full rounded-lg bg-[#176bff] text-sm font-black text-white shadow-[0_10px_26px_rgba(23,107,255,0.25)] disabled:opacity-60">
        {submitting ? "提交中..." : mode === "parse" ? "开始提取" : "开始提取文案/字幕"}
      </button>
      {message ? <div className="mt-3 rounded-lg bg-[#f2f7ff] px-4 py-3 text-sm font-medium text-[#176bff]">{message}</div> : null}
      <h2 className="mt-6 text-sm font-black">支持的平台</h2>
      <div className="mt-4 grid grid-cols-8 gap-4 text-center">
        {platforms.map(([name, mark, color]) => <button type="button" key={name} onClick={() => setMessage(`${name} 平台已选，粘贴链接后即可提交`)}><span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${color}`}>{mark}</span><div className="mt-2 text-xs text-[#667693]">{name}</div></button>)}
      </div>
      <div className="mt-7 rounded-lg bg-[#f2f7ff] px-4 py-3 text-sm font-medium text-[#176bff]">请确保拥有视频的合法使用权，仅用于个人学习与研究。</div>
    </section>
  );
}

function ResultPanel({ job, loading }: { job: Job | null; loading: boolean }) {
  const result = normalizeVideoResult(job?.result);
  return (
    <section className="rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-[20px] font-black">解析结果</h2>{job ? <span className="flex items-center gap-2 text-sm font-bold text-[#18b878]"><CheckCircle2 className="h-4 w-4" />解析成功</span> : null}</div>
      {!job ? <EmptyState text={loading ? "正在读取真实解析记录..." : "暂无真实解析结果"} /> : (
        <>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <button type="button" aria-label="视频预览暂未接入" onClick={() => undefined} className="flex h-[158px] items-center justify-center overflow-hidden rounded-lg bg-[#edf4ff] text-[#176bff]"><Play className="h-12 w-12" /></button>
            <div>
              <h3 className="text-[19px] font-black">{result.title || job.input_file?.original_name || "视频解析任务"}</h3>
              <div className="mt-8 grid grid-cols-3 gap-y-6 text-sm">
                <Info label="平台" value={result.platform || "-"} />
                <Info label="格式" value={result.format || "-"} />
                <Info label="大小" value={formatBytes(job.output_file?.size_bytes ?? job.input_file?.size_bytes)} />
                <Info label="创建时间" value={formatDate(job.created_at)} />
              </div>
            </div>
          </div>
          <h3 className="mt-5 text-sm font-black">提取内容</h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ExtractCard title="文案结果" desc={result.text || "当前任务未返回文案"} />
            <ExtractCard title="字幕结果" desc={result.subtitle || "当前任务未返回字幕"} />
          </div>
        </>
      )}
    </section>
  );
}

function RecentTasks({ jobs, loading, error, onRefresh }: { jobs: Job[]; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <section className="mt-5 rounded-xl border border-[#e2eaf5] bg-white p-5 shadow-[0_12px_34px_rgba(45,83,148,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-black">最近任务<button type="button" onClick={onRefresh} className="ml-3 rounded-md border border-[#dbe5f2] px-3 py-1 text-sm font-medium text-[#52627f]"><RefreshCw className="mr-1 inline h-4 w-4" />刷新</button></h2>
        <button type="button" onClick={onRefresh} className="flex items-center gap-2 text-sm font-bold text-[#176bff]">查看全部任务 <ArrowRight className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid grid-cols-[1.5fr_0.8fr_1fr_0.7fr_1fr_0.7fr] border-b border-[#e5ebf5] px-3 pb-3 text-sm font-medium text-[#667693]">
        {["任务", "来源", "内容", "状态", "创建时间", "操作"].map((h) => <span key={h}>{h}</span>)}
      </div>
      {error ? <EmptyState text={error} /> : loading ? <EmptyState text="正在读取真实任务..." /> : jobs.length ? jobs.map((job) => <TaskRow key={job.id} job={job} onRefresh={onRefresh} />) : <EmptyState text="暂无真实视频任务" />}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <span><span className="block text-[#667693]">{label}</span><span className="mt-2 block font-black">{value}</span></span>;
}

function ExtractCard({ title, desc }: { title: string; desc: string }) {
  async function copy() { await navigator.clipboard?.writeText(desc); }
  return <button type="button" onClick={() => void copy()} className="rounded-lg border border-[#e2eaf5] p-4 text-left"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1ecff] text-[#7b45ee]"><FileText className="h-5 w-5" /></span><span><span className="block font-black">{title}</span><span className="line-clamp-2 text-xs text-[#667693]">{desc}</span></span></div></button>;
}

function TaskRow({ job, onRefresh }: { job: Job; onRefresh: () => void }) {
  const input = normalizeInput(job.input);
  const result = normalizeVideoResult(job.result);
  async function copyResult() { await navigator.clipboard?.writeText(result.text || result.subtitle || input.url || job.id); }
  async function handleDelete() { await deleteJob(job.id); await onRefresh(); }
  async function handleDownload() { if (job.output_file?.id) await downloadFile(`/api/files/${job.output_file.id}/download`); else await copyResult(); }
  return (
    <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.7fr_1fr_0.7fr] items-center border-b border-[#eef2f8] px-3 py-3 text-sm text-[#52627f]">
      <span className="font-bold text-[#17203c]">{job.input_file?.original_name || input.url || job.id}</span>
      <span>{input.platform || "-"}</span>
      <span>{job.type === "VIDEO_TRANSCRIBE" ? "视频 + 字幕" : "视频 + 文案"}</span>
      <span><span className={`rounded-full px-3 py-1 text-xs font-bold ${jobStatusClass(job.status)}`}>{jobStatusText(job.status)}</span></span>
      <span>{formatDate(job.created_at)}</span>
      <span className="flex gap-3 text-[#176bff]">
        <button type="button" onClick={() => void handleDownload()} title="下载或复制" aria-label="下载或复制"><ArrowDownToLine className="h-4 w-4" /></button>
        <button type="button" onClick={() => void copyResult()} title="复制结果" aria-label="复制结果"><Copy className="h-4 w-4" /></button>
        <button type="button" onClick={() => void handleDelete()} title="删除任务" aria-label="删除任务"><Trash2 className="h-4 w-4" /></button>
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-[#dbe5f2] text-sm font-bold text-[#667693]">{text}</div>;
}

function normalizeInput(input: unknown) {
  if (!input || typeof input !== "object") return { url: "", platform: "" };
  const data = input as { url?: unknown; source_url?: unknown; platform?: unknown };
  return { url: typeof data.url === "string" ? data.url : typeof data.source_url === "string" ? data.source_url : "", platform: typeof data.platform === "string" ? data.platform : "" };
}

function normalizeVideoResult(result: unknown) {
  if (!result || typeof result !== "object") return { title: "", platform: "", format: "", text: "", subtitle: "" };
  const data = result as Record<string, unknown>;
  const nested = typeof data.data === "object" && data.data ? data.data as Record<string, unknown> : {};
  return {
    title: readString(data.title) || readString(nested.title),
    platform: readString(data.platform) || readString(nested.platform),
    format: readString(data.format) || readString(nested.format),
    text: readString(data.text) || readString(data.copywriting),
    subtitle: readString(data.subtitle) || readString(data.transcript),
  };
}

function readString(value: unknown) { return typeof value === "string" ? value : ""; }
function formatDate(value?: string) { if (!value) return "-"; return new Date(value).toLocaleString("zh-CN", { hour12: false }); }
