"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Home,
  Info,
  KeyRound,
  Megaphone,
  Menu,
  Save,
  Search,
  Settings,
  ShieldCheck,
  TestTube2,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import { apiJson } from "@/lib/api";
import { Logo } from "../components/SiteHeader";

type AdminTab = "data" | "cards" | "users" | "api" | "notice";
type NavItem = { key: AdminTab; label: string; icon: ComponentType<{ className?: string }> };

type AdminDashboard = {
  stats: {
    todayRequests: number;
    yesterdayRequests: number;
    activeUsers: number;
    totalUsers: number;
    newUsersToday: number;
    cardUsed: number;
    cardTotal: number;
    apiSuccessRate: number;
  };
  trend: Array<{ date: string; requests: number }>;
  moduleShares: Array<{ name: string; value: number }>;
  recentActivities: Array<{ time: string; module: string; action: string; status: string }>;
  recentUsers: Array<{ email: string; membershipStatus: string; createdAt: string }>;
  apiOverview: { configured: number; total: number; updatedAt: string };
  announcements: Array<{ title: string; time: string; status?: string }>;
};

type ApiConfig = {
  contentApiKey: string;
  speechApiKey: string;
  copyExtractApiKey: string;
  biliCookie: string;
  wechatSupportId: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: string;
  smtpFromName: string;
  updatedAt: string;
};

const emptyDashboard: AdminDashboard = {
  stats: { todayRequests: 0, yesterdayRequests: 0, activeUsers: 0, totalUsers: 0, newUsersToday: 0, cardUsed: 0, cardTotal: 0, apiSuccessRate: 0 },
  trend: [],
  moduleShares: [],
  recentActivities: [],
  recentUsers: [],
  apiOverview: { configured: 0, total: 0, updatedAt: "" },
  announcements: [],
};

const defaultApiConfig: ApiConfig = {
  contentApiKey: "",
  speechApiKey: "",
  copyExtractApiKey: "",
  biliCookie: "",
  wechatSupportId: "",
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  smtpPassword: "",
  smtpSecure: "",
  smtpFromName: "",
  updatedAt: "",
};

const navItems: NavItem[] = [
  { key: "data", label: "数据", icon: BarChart3 },
  { key: "cards", label: "卡密", icon: CreditCard },
  { key: "users", label: "用户", icon: Users },
  { key: "api", label: "API配置", icon: Settings },
  { key: "notice", label: "公告", icon: Megaphone },
];

export default function AdminPage() {
  const [active, setActive] = useState<AdminTab>("data");
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const activeLabel = navItems.find((item) => item.key === active)?.label ?? "数据";

  useEffect(() => {
    let cancelled = false;
    async function loadAdminData() {
      setLoading(true);
      setLoadError("");
      try {
        const [dashboardData, configData] = await Promise.all([
          apiJson<AdminDashboard>("/api/admin/dashboard"),
          apiJson<ApiConfig>("/api/admin/config"),
        ]);
        if (!cancelled) {
          setDashboard(dashboardData);
          setApiConfig({ ...defaultApiConfig, ...configData });
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "后台数据加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAdminData();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#f5f8ff] text-[#111936]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-[#e4ebf5] bg-white shadow-[16px_0_42px_rgba(40,79,139,0.06)]">
        <div className="flex h-[76px] items-center gap-3 px-7">
          <Logo dark />
          <span className="text-[24px] font-black tracking-normal">灵析后台</span>
        </div>
        <nav className="mt-5 space-y-3 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = item.key === active;
            return (
              <button key={item.key} onClick={() => setActive(item.key)} className={`relative flex h-12 w-full items-center gap-4 rounded-lg px-6 text-[16px] font-bold transition ${selected ? "bg-[#eef5ff] text-[#176bff]" : "text-[#7d8ca8] hover:bg-[#f5f8ff] hover:text-[#176bff]"}`}>
                {selected ? <span className="absolute -left-3 top-0 h-full w-1 rounded-r-full bg-[#176bff]" /> : null}
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${selected ? "bg-[#176bff] text-white" : ""}`}><Icon className="h-4 w-4" /></span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-2xl bg-[linear-gradient(180deg,#f4f8ff,#ffffff)] p-4 text-center shadow-[0_18px_46px_rgba(37,99,235,0.1)]">
            <div className="mx-auto mb-3 flex h-[92px] w-[92px] items-center justify-center"><Logo dark size="lg" /></div>
            <div className="text-base font-black">灵析 · 让效率触手可及</div>
            <div className="mt-1 text-xs text-[#7d8ca8]">一站式实用工具平台</div>
            <Link href="/" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#176bff] text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,107,255,0.28)]">
              前往官网 <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      <section className="pl-[220px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e4ebf5] bg-white/92 px-10 backdrop-blur-xl">
          <div className="flex items-center gap-7">
            <button onClick={() => adminNotice("侧边栏已展开")} className="text-[#42506b]"><Menu className="h-5 w-5" /></button>
            <div className="text-base font-bold text-[#111936]">{activeLabel} <span className="mx-2 text-[#b7c1d2]">/</span><span className="font-medium text-[#70809d]">概览</span></div>
          </div>
          <div className="flex items-center gap-6">
            <label className="hidden h-10 w-[320px] items-center gap-3 rounded-lg border border-[#dce6f5] bg-white px-4 text-[#8a98b2] shadow-sm xl:flex">
              <Search className="h-5 w-5" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a98b2]" placeholder="搜索功能、用户、卡密等..." />
              <span className="text-xs font-bold text-[#8a98b2]">⌘K</span>
            </label>
            <button onClick={() => adminNotice("暂无新的真实通知")} className="relative text-[#42506b]"><Bell className="h-5 w-5" /><span className="absolute -right-2 -top-2 rounded-full bg-[#ff5b69] px-1.5 text-[10px] font-bold text-white">0</span></button>
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f6e5d6] to-[#e5edf9] text-lg">A</div><span className="font-semibold text-[#42506b]">Admin</span><ChevronDown className="h-4 w-4 text-[#70809d]" /></div>
          </div>
        </header>
        <div className="px-10 py-6">
          {loadError ? <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{loadError}</div> : null}
          {active === "data" ? <Dashboard data={dashboard} loading={loading} /> : active === "api" ? <ApiConfigPanel config={apiConfig} onSaved={setApiConfig} /> : <ManagementPanel title={activeLabel} />}
          <footer className="mt-7 border-t border-[#dde7f4] pt-4 text-center text-sm text-[#8a98b2]">© 2024 灵析 Lingxi · 让效率触手可及 <span className="mx-8">服务条款</span><span>隐私政策</span><span className="mx-8">帮助中心</span></footer>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ data, loading }: { data: AdminDashboard; loading: boolean }) {
  const stats = [
    { title: "今日请求量", value: data.stats.todayRequests, note: `昨日 ${formatNumber(data.stats.yesterdayRequests)}`, icon: Activity, tone: "blue" },
    { title: "活跃用户", value: data.stats.activeUsers, note: `总用户 ${formatNumber(data.stats.totalUsers)}`, icon: UserRound, tone: "mint" },
    { title: "卡密使用数", value: data.stats.cardUsed, note: `总卡密 ${formatNumber(data.stats.cardTotal)}`, icon: KeyRound, tone: "orange" },
    { title: "API成功率", value: `${data.stats.apiSuccessRate}%`, note: "基于真实任务状态", icon: ShieldCheck, tone: "violet" },
  ] as const;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-6">{stats.map((card) => <MetricCard key={card.title} {...card} />)}</div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-6">
        <Panel className="min-h-[330px]" title="请求量趋势"><TrendLine data={data.trend} loading={loading} /></Panel>
        <Panel className="min-h-[330px]" title="模块使用占比"><ModuleShare data={data.moduleShares} /></Panel>
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-6">
        <Panel title="最近活动"><ActivityTable rows={data.recentActivities} /></Panel>
        <div className="space-y-4"><CardOverview used={data.stats.cardUsed} total={data.stats.cardTotal} /><UserOverview total={data.stats.totalUsers} today={data.stats.newUsersToday} active={data.stats.activeUsers} users={data.recentUsers} /><div className="grid grid-cols-2 gap-4"><ApiOverview data={data.apiOverview} /><NoticeOverview rows={data.announcements} /></div></div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone }: { title: string; value: string | number; note: string; icon: ComponentType<{ className?: string }>; tone: string }) {
  return <section className="rounded-xl border border-[#e3ebf6] bg-white p-5 shadow-[0_14px_36px_rgba(39,76,135,0.08)]"><div className="flex items-center justify-between gap-5"><div><div className="flex items-center gap-2 text-sm font-bold text-[#50607c]">{title}<Info className="h-3.5 w-3.5 text-[#9aaccc]" /></div><div className="mt-4 text-[30px] font-black leading-none tracking-normal text-[#07122e]">{typeof value === "number" ? formatNumber(value) : value}</div><div className="mt-4 text-sm font-bold text-[#50607c]">{note}</div></div><StatOrb tone={tone}><Icon className="h-8 w-8" /></StatOrb></div></section>;
}

function StatOrb({ tone, children }: { tone: string; children: ReactNode }) {
  const styles: Record<string, string> = { blue: "from-[#5aa3ff] to-[#176bff]", mint: "from-[#72ead3] to-[#36cbb1]", orange: "from-[#ffc99d] to-[#ff9558]", violet: "from-[#c2a7ff] to-[#815dff]" };
  return <div className={`relative flex h-[86px] w-[86px] items-center justify-center rounded-full bg-gradient-to-br ${styles[tone]} text-white shadow-[0_18px_30px_rgba(23,107,255,0.18)]`}><div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/18 backdrop-blur">{children}</div></div>;
}

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e3ebf6] bg-white p-5 shadow-[0_14px_36px_rgba(39,76,135,0.08)] ${className}`}><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black text-[#111936]">{title}<Info className="h-4 w-4 text-[#9aaccc]" /></h2></div>{children}</section>;
}

function TrendLine({ data, loading }: { data: AdminDashboard["trend"]; loading: boolean }) {
  if (loading) return <EmptyState text="正在加载真实趋势数据..." />;
  if (!data.length) return <EmptyState text="暂无请求趋势数据" />;
  const width = 760, height = 190, top = 16, bottom = 170;
  const max = Math.max(...data.map((item) => item.requests), 1);
  const points = data.map((item, index) => ({ ...item, x: data.length === 1 ? width / 2 : (index / (data.length - 1)) * width, y: top + (1 - item.requests / max) * (bottom - top) }));
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  return <div><svg viewBox="0 0 760 210" className="h-[250px] w-full overflow-visible"><defs><linearGradient id="lineFillAdmin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#176bff" stopOpacity="0.22" /><stop offset="100%" stopColor="#176bff" stopOpacity="0" /></linearGradient></defs><path d={areaPath} fill="url(#lineFillAdmin)" /><path d={linePath} fill="none" stroke="#176bff" strokeWidth="4" strokeLinecap="round" />{points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="6" fill="#176bff" stroke="#fff" strokeWidth="4" />)}<g>{points.map((point) => <text key={point.date} x={point.x} y="205" textAnchor="middle" className="fill-[#7d8ca8] text-xs">{point.date}</text>)}</g></svg></div>;
}

const chartColors = ["#2468ff", "#63a3ff", "#ff777b", "#ffb66d", "#c7cfdd", "#7a5cff"];
function ModuleShare({ data }: { data: AdminDashboard["moduleShares"] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyState text="暂无模块使用数据" />;
  return <div className="grid h-full grid-cols-[210px_1fr] items-center gap-8"><DonutChart data={data.map((item, index) => ({ ...item, color: chartColors[index % chartColors.length] }))} total={total} /><div className="space-y-4">{data.map((item, index) => <div key={item.name} className="grid grid-cols-[1fr_70px] items-center gap-4 text-sm"><div className="flex items-center gap-3 text-[#70809d]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />{item.name}</div><div className="text-right font-bold text-[#50607c]">{formatPercent(item.value, total)}</div></div>)}</div></div>;
}
function DonutChart({ data, total }: { data: Array<{ value: number; color: string }>; total: number }) {
  let start = 0;
  const gradient = data.map((item) => { const end = start + (item.value / total) * 100; const stop = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`; start = end; return stop; }).join(", ");
  return <div className="relative mx-auto h-[190px] w-[190px] rounded-full" style={{ background: `conic-gradient(${gradient})` }}><div className="absolute inset-[48px] flex flex-col items-center justify-center rounded-full bg-white"><div className="text-2xl font-black text-[#111936]">{formatNumber(total)}</div><div className="mt-1 text-xs font-bold text-[#8a98b2]">总请求量</div></div></div>;
}

function ActivityTable({ rows }: { rows: AdminDashboard["recentActivities"] }) {
  if (!rows.length) return <EmptyState text="暂无最近活动" />;
  return <div className="overflow-hidden rounded-lg border border-[#e3ebf6]"><table className="w-full text-left text-sm"><thead className="bg-[#f7f9fd] text-[#70809d]"><tr>{["时间", "模块", "操作", "状态"].map((header) => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.time}-${index}`} className="border-t border-[#edf2f8]"><td className="px-4 py-3 text-[#50607c]">{formatDateTime(row.time)}</td><td className="px-4 py-3">{row.module}</td><td className="px-4 py-3">{row.action}</td><td className="px-4 py-3"><StatusPill success={row.status !== "failed"}>{row.status}</StatusPill></td></tr>)}</tbody></table></div>;
}

function CardOverview({ used, total }: { used: number; total: number }) {
  const usage = total ? Math.round((used / total) * 100) : 0;
  return <Panel title="卡密概览"><div className="grid grid-cols-[1fr_1fr_1fr_1.25fr] items-end gap-5"><MiniNumber label="总卡密数" value={formatNumber(total)} /><MiniNumber label="已使用" value={formatNumber(used)} /><MiniNumber label="未使用" value={formatNumber(Math.max(total - used, 0))} /><div><div className="mb-2 text-xs text-[#70809d]">使用率 {usage}%</div><div className="h-1.5 rounded-full bg-[#d7e3f5]"><div className="h-full rounded-full bg-[#176bff]" style={{ width: `${usage}%` }} /></div></div></div></Panel>;
}
function UserOverview({ total, today, active, users }: { total: number; today: number; active: number; users: AdminDashboard["recentUsers"] }) {
  return <Panel title="用户概览"><div className="mb-4 grid grid-cols-3 gap-8"><MiniNumber label="总用户数" value={formatNumber(total)} /><MiniNumber label="今日新增" value={formatNumber(today)} /><MiniNumber label="活跃用户" value={formatNumber(active)} /></div>{users.length ? <div className="grid grid-cols-4 gap-2">{users.slice(0, 4).map((user, index) => <div key={user.email} className="flex items-center gap-2 rounded-lg border border-[#e3ebf6] bg-white px-2 py-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50">{index + 1}</div><div className="min-w-0"><div className="truncate text-xs font-bold text-[#111936]">{user.email}</div><div className="text-[10px] font-bold text-[#20b889]">{user.membershipStatus}</div></div></div>)}</div> : <EmptyState text="暂无用户数据" compact />}</Panel>;
}
function ApiOverview({ data }: { data: AdminDashboard["apiOverview"] }) {
  return <Panel title="API配置概览"><div className="space-y-3 text-sm"><KeyValue label="已配置项" value={`${data.configured}/${data.total}`} ok={data.configured > 0} /><KeyValue label="最后更新" value={data.updatedAt ? formatDateTime(data.updatedAt) : "暂无"} /><KeyValue label="配置来源" value="后端数据库" badge="真实" /></div></Panel>;
}
function NoticeOverview({ rows }: { rows: AdminDashboard["announcements"] }) {
  return <Panel title="公告">{rows.length ? <div className="space-y-3">{rows.map(({ title, time, status }) => <div key={title} className="flex items-center justify-between gap-3 border-b border-[#edf2f8] pb-3 last:border-0 last:pb-0"><div><div className="text-sm font-bold text-[#50607c]">{title}</div><div className="mt-1 text-xs text-[#8a98b2]">{formatDateTime(time)}</div></div><span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-500">{status ?? "已发布"}</span></div>)}</div> : <EmptyState text="暂无公告数据" compact />}</Panel>;
}
function MiniNumber({ label, value }: { label: string; value: string }) { return <div><div className="text-xs font-bold text-[#8a98b2]">{label}</div><div className="mt-1 text-xl font-black text-[#111936]">{value}</div></div>; }
function KeyValue({ label, value, ok, badge }: { label: string; value: string; ok?: boolean; badge?: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-[#70809d]">{label}</span><span className="flex min-w-0 items-center gap-2 font-bold text-[#50607c]"><span className="truncate">{value}</span>{ok ? <span className="text-xs text-emerald-500">正常</span> : null}{badge ? <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-[#176bff]">{badge}</span> : null}</span></div>; }

function ApiConfigPanel({ config: initialConfig, onSaved }: { config: ApiConfig; onSaved: (config: ApiConfig) => void }) {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  useEffect(() => { setConfig(initialConfig); }, [initialConfig]);
  function updateConfig<K extends keyof ApiConfig>(key: K, value: ApiConfig[K]) { setConfig((current) => ({ ...current, [key]: value })); }
  async function saveConfig(label = "配置") {
    try {
      const saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PUT", body: JSON.stringify(stripUpdatedAt(config)) });
      const next = { ...defaultApiConfig, ...saved };
      setConfig(next); onSaved(next); setNotice(`${label}已保存到后端`);
    } catch (err) { setNotice(err instanceof Error ? err.message : `${label}保存失败`); }
  }
  async function testConfig(label: string, key: keyof ApiConfig) {
    try { const result = await apiJson<{ ok: boolean; message: string }>(`/api/admin/config/test/${String(key)}`, { method: "POST" }); setNotice(`${label}：${result.message}`); }
    catch (err) { setNotice(err instanceof Error ? err.message : `${label}测试失败`); }
  }
  return (
    <div className="space-y-5">
      <Panel title="API 配置管理"><div className="text-sm leading-6 text-[#70809d]">集中管理第三方 API 密钥、Cookie、客服微信和邮件 SMTP。配置会保存到后端数据库，业务服务可直接读取。</div></Panel>
      <ApiSecretSection title="文案 / 图片 / 视频 API Key" desc="用于文案生成、图片生成、视频生成，三个功能共用。" updatedAt={config.updatedAt} value={config.contentApiKey} visible={visible.contentApiKey} onToggle={() => setVisible((v) => ({ ...v, contentApiKey: !v.contentApiKey }))} onChange={(value) => updateConfig("contentApiKey", value)} onSave={() => void saveConfig("文案 / 图片 / 视频 API Key")} onTest={() => void testConfig("文案 / 图片 / 视频 API Key", "contentApiKey")} />
      <ApiSecretSection title="语音生成 API Key" desc="用于语音生成、克隆音色、声音定制等语音功能。" updatedAt={config.updatedAt} value={config.speechApiKey} visible={visible.speechApiKey} onToggle={() => setVisible((v) => ({ ...v, speechApiKey: !v.speechApiKey }))} onChange={(value) => updateConfig("speechApiKey", value)} onSave={() => void saveConfig("语音生成 API Key")} onTest={() => void testConfig("语音生成 API Key", "speechApiKey")} />
      <ApiSecretSection title="文案提取 API Key" desc="媒体处理中文案提取所需的识别密钥。" updatedAt={config.updatedAt} value={config.copyExtractApiKey} visible={visible.copyExtractApiKey} onToggle={() => setVisible((v) => ({ ...v, copyExtractApiKey: !v.copyExtractApiKey }))} onChange={(value) => updateConfig("copyExtractApiKey", value)} onSave={() => void saveConfig("文案提取 API Key")} onTest={() => void testConfig("文案提取 API Key", "copyExtractApiKey")} />
      <Panel title="B站 Cookie"><textarea className="min-h-[116px] w-full resize-y rounded-lg border border-[#dce6f5] bg-[#f8fbff] px-4 py-3 font-mono text-sm text-[#111936] outline-none transition focus:border-[#176bff] focus:bg-white focus:ring-4 focus:ring-blue-50" value={config.biliCookie} onChange={(event) => updateConfig("biliCookie", event.target.value)} placeholder="粘贴完整 Cookie" /><div className="mt-3 flex items-center justify-between gap-4"><div className="text-sm text-[#70809d]">媒体处理解析/提取 B 站视频时使用。浏览器登录 bilibili.com 后从 Network 请求中复制完整 Cookie。</div><button onClick={() => void saveConfig("B站 Cookie")} className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#176bff] px-4 text-sm font-bold text-white"><Save className="h-4 w-4" /> 保存</button></div></Panel>
      <Panel title="微信配置"><label className="mb-2 block text-sm font-bold text-[#50607c]">客服微信号</label><div className="flex gap-3"><input className="h-11 min-w-0 flex-1 rounded-lg border border-[#dce6f5] bg-[#f8fbff] px-4 text-sm outline-none transition focus:border-[#176bff] focus:bg-white focus:ring-4 focus:ring-blue-50" value={config.wechatSupportId} onChange={(event) => updateConfig("wechatSupportId", event.target.value)} placeholder="输入微信号，如：hg91587" /><button onClick={() => void saveConfig("微信配置")} className="flex h-11 items-center gap-2 rounded-lg bg-[#176bff] px-4 text-sm font-bold text-white"><Save className="h-4 w-4" /> 保存</button></div></Panel>
      <Panel title="邮件 SMTP 配置"><div className="grid grid-cols-2 gap-4"><ConfigField label="SMTP 服务器地址" value={config.smtpHost} onChange={(value) => updateConfig("smtpHost", value)} placeholder="smtp.qq.com" /><ConfigField label="SMTP 端口" value={config.smtpPort} onChange={(value) => updateConfig("smtpPort", value)} placeholder="465" /><ConfigField label="发信邮箱账号" value={config.smtpUser} onChange={(value) => updateConfig("smtpUser", value)} placeholder="example@qq.com" /><ConfigField label="加密方式" value={config.smtpSecure} onChange={(value) => updateConfig("smtpSecure", value)} placeholder="ssl / tls" /><ConfigField label="发件人显示名称" value={config.smtpFromName} onChange={(value) => updateConfig("smtpFromName", value)} placeholder="灵析" /><ApiSecretField label="SMTP 授权密码" value={config.smtpPassword} visible={visible.smtpPassword} onToggle={() => setVisible((v) => ({ ...v, smtpPassword: !v.smtpPassword }))} onChange={(value) => updateConfig("smtpPassword", value)} /></div><div className="mt-5 flex justify-end gap-3"><button onClick={() => void testConfig("SMTP 邮件", "smtpPassword")} className="flex h-10 items-center gap-2 rounded-lg border border-[#dce6f5] px-4 text-sm font-bold text-[#50607c]"><TestTube2 className="h-4 w-4" /> 测试 SMTP</button><button onClick={() => void saveConfig("SMTP 配置")} className="flex h-10 items-center gap-2 rounded-lg bg-[#176bff] px-4 text-sm font-bold text-white"><Save className="h-4 w-4" /> 保存 SMTP 配置</button></div></Panel>
      <button onClick={() => void saveConfig("全部配置")} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#176bff] text-sm font-black text-white shadow-[0_14px_30px_rgba(23,107,255,0.22)]"><Save className="h-4 w-4" /> 保存所有配置</button>
      {notice ? <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-[#176bff]">{notice}</div> : null}
      <Panel title="安全说明"><ul className="space-y-2 text-sm leading-6 text-[#70809d]"><li>• 所有 API 密钥建议加密存储在服务端，前端代码无法访问明文。</li><li>• 密钥传输建议通过 HTTPS，并在保存后立即生效。</li><li>• 建议定期更换 API 密钥和 Cookie，降低泄露风险。</li></ul></Panel>
    </div>
  );
}

function ApiSecretSection(props: { title: string; desc: string; updatedAt: string; value: string; visible?: boolean; onChange: (value: string) => void; onToggle: () => void; onSave: () => void; onTest: () => void }) {
  return <Panel title={props.title}><div className="flex gap-3"><ApiSecretField value={props.value} visible={props.visible} onToggle={props.onToggle} onChange={props.onChange} /><button onClick={props.onSave} className="flex h-11 items-center gap-2 rounded-lg bg-[#176bff] px-4 text-sm font-bold text-white"><Save className="h-4 w-4" /> 保存</button><button onClick={props.onTest} className="flex h-11 items-center gap-2 rounded-lg border border-[#dce6f5] px-4 text-sm font-bold text-[#50607c]"><TestTube2 className="h-4 w-4" /> 测试</button></div><div className="mt-3 text-sm text-[#8a98b2]">最后更新：{props.updatedAt || "暂无"}</div><div className="mt-2 text-sm text-[#70809d]">{props.desc}</div></Panel>;
}
function ApiSecretField({ label, value, visible, onToggle, onChange }: { label?: string; value: string; visible?: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return <label className="block min-w-0 flex-1">{label ? <span className="mb-2 block text-sm font-bold text-[#50607c]">{label}</span> : null}<span className="flex h-11 items-center rounded-lg border border-[#dce6f5] bg-[#f8fbff] px-4 transition focus-within:border-[#176bff] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50"><input className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[#111936] outline-none" type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder="请输入 API Key" /><button type="button" onClick={onToggle} className="ml-3 text-[#8a98b2] hover:text-[#176bff]">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>;
}
function ConfigField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label><span className="mb-2 block text-sm font-bold text-[#50607c]">{label}</span><input className="h-11 w-full rounded-lg border border-[#dce6f5] bg-[#f8fbff] px-4 text-sm text-[#111936] outline-none transition focus:border-[#176bff] focus:bg-white focus:ring-4 focus:ring-blue-50" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
function stripUpdatedAt(config: ApiConfig) { const { updatedAt: _updatedAt, ...payload } = config; return payload; }
function ManagementPanel({ title }: { title: string }) { return <div className="grid grid-cols-[1fr_360px] gap-6"><Panel title={`${title}管理`}><EmptyState text={`${title}暂无真实数据`} /></Panel><Panel title="快捷设置"><div className="space-y-4"><SettingRow title="权限控制" desc="配置后台访问权限" /><SettingRow title="操作记录" desc="查看最近操作日志" /><SettingRow title="数据同步" desc="同步前台业务数据" /></div></Panel></div>; }
function SettingRow({ title, desc }: { title: string; desc: string }) { return <div className="rounded-lg border border-[#e3ebf6] bg-[#f8fbff] p-4"><div className="font-black text-[#111936]">{title}</div><div className="mt-1 text-sm text-[#70809d]">{desc}</div></div>; }
function StatusPill({ success, children }: { success: boolean; children: ReactNode }) { return <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${success ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>{success ? <Check className="h-3 w-3" /> : null}{children}</span>; }
function formatNumber(value: number) { return new Intl.NumberFormat("zh-CN").format(value); }
function formatPercent(value: number, total: number) { return `${((value / total) * 100).toFixed(2)}%`; }
function formatDateTime(value: string) { if (!value) return "暂无"; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return date.toLocaleString("zh-CN", { hour12: false }); }
function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) { return <div className={`flex items-center justify-center rounded-lg border border-dashed border-[#dce6f5] bg-[#f8fbff] text-sm font-bold text-[#8a98b2] ${compact ? "h-20" : "h-[210px]"}`}>{text}</div>; }
function buildSmoothPath(points: Array<{ x: number; y: number }>) { if (!points.length) return ""; if (points.length === 1) return `M ${points[0].x} ${points[0].y}`; return points.slice(1).reduce((path, point, index) => { const prev = points[index]; const midX = (prev.x + point.x) / 2; return `${path} C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`; }, `M ${points[0].x} ${points[0].y}`); }
function adminNotice(message: string) { if (typeof window !== "undefined") window.alert(message); }
