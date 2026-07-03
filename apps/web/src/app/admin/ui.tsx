"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export function PageTitle({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return <div className="flex items-end justify-between"><div><h1 className="text-[30px] font-black tracking-normal">{title}</h1><p className="mt-3 text-[15px] font-medium text-[#667693]">{desc}</p></div>{action}</div>;
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">{title || action ? <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2>{action}</div> : null}{children}</section>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-4 rounded-xl border border-[#e3ebf6] bg-white p-5 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex h-11 w-[330px] items-center gap-3 rounded-lg border border-[#dce6f5] bg-white px-4 text-[#9aa8c0]"><Search className="h-5 w-5" /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={placeholder} /></label>;
}

export function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-[190px] appearance-none rounded-lg border border-[#dce6f5] bg-white px-4 text-sm font-bold text-[#53617d] outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-[#8b98b2]" /></label>;
}

export function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-[#e3ebf6]"><table className="w-full text-left text-sm"><thead className="bg-[#f8fbff] text-[#53617d]"><tr>{headers.map((header) => <th key={header} className="px-5 py-4 font-black">{header}</th>)}</tr></thead><tbody className="text-[#33415f]">{children}</tbody></table></div>;
}

export function ActionGroup({ actions }: { actions: Array<[string, () => void]> }) {
  return <div className="flex items-center gap-4">{actions.map(([label, action]) => <button key={label} type="button" onClick={action} className={`font-black transition ${label === "删除" || label === "禁用" ? "text-red-500 hover:text-red-600" : "text-[#176bff] hover:text-[#0f5bea]"}`}>{label}</button>)}</div>;
}

export function Pagination({ total, pageSize }: { total: number; pageSize: string }) {
  return <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#667693]"><span>共 {total} 条</span><div className="flex items-center gap-3"><button type="button" className="admin-page" aria-label="上一页"><ChevronLeft className="h-4 w-4" /></button><button type="button" className="admin-page border-[#176bff] text-[#176bff]">1</button><button type="button" className="admin-page" aria-label="下一页"><ChevronRight className="h-4 w-4" /></button><button type="button" className="admin-filter">{pageSize}<ChevronDown className="h-4 w-4" /></button></div></div>;
}

export function StatusBadge({ value }: { value: string }) {
  const good = ["正常", "未使用", "已发布", "已启用"].includes(value);
  const warn = ["草稿", "未配置"].includes(value);
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${good ? "bg-emerald-50 text-emerald-600" : warn ? "bg-slate-100 text-slate-500" : value === "已使用" ? "bg-blue-50 text-[#176bff]" : "bg-red-50 text-red-500"}`}>{value}</span>;
}

export function TypeBadge({ value }: { value: string }) {
  const cls = value === "系统通知" ? "bg-blue-50 text-[#176bff]" : value === "重要通知" ? "bg-violet-50 text-violet-600" : value === "功能更新" ? "bg-orange-50 text-orange-500" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

export function InfoRow({ label, value, link = false }: { label: string; value: string; link?: boolean }) {
  return <div className="mt-3 grid grid-cols-[90px_1fr] text-sm"><span className="font-bold text-[#7b88a4]">{label}</span><span className={`break-all font-bold ${link ? "text-[#176bff]" : "text-[#33415f]"}`}>{value}</span></div>;
}

export function IconButton({ label, icon: Icon, onClick, danger = false }: { label: string; icon: ComponentType<{ className?: string }>; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 text-sm font-black transition ${danger ? "text-red-500 hover:text-red-600" : "text-[#176bff] hover:text-[#0f5bea]"}`}><Icon className="h-4 w-4" />{label}</button>;
}

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#53617d]">{label}</span>{children}</label>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101936]/30 px-6 backdrop-blur-sm"><section className="w-full max-w-[560px] rounded-xl bg-white p-6 shadow-[0_30px_90px_rgba(16,25,54,0.26)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#eef5ff]"><X className="h-5 w-5" /></button></div>{children}</section></div>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-[#dce6f5] bg-[#f8fbff] text-sm font-bold text-[#8b98b2]">{text}</div>;
}
