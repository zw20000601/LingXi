"use client";

import {
  Activity,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Code2,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Home,
  KeyRound,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";

import { ApiError, apiJson, getToken, setToken, type AuthResponse } from "@/lib/api";
import { Logo } from "../components/SiteHeader";
import { ActionGroup, AdminField, AdminTable, EmptyState, FilterBar, IconButton, InfoRow, Modal, PageTitle, Pagination, Panel, SearchBox, SelectBox, StatusBadge, TypeBadge } from "./ui";

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
  functionRank?: Array<{ name: string; type: string; count: number; share: number }>;
  recentUsers: Array<{ id: string; email: string; username?: string; membershipStatus: string; isDisabled?: boolean; createdAt: string }>;
  apiOverview: { configured: number; total: number; updatedAt: string };
  announcements: Array<Notice>;
};

type TrendRange = "近一天" | "近7天" | "近一个月";

type ApiConfig = {
  [key: string]: string | CustomConfigField[] | undefined;
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
  customFields?: CustomConfigField[];
};

type CustomConfigField = {
  key: string;
  label: string;
  group: string;
  secret?: boolean;
  placeholder?: string;
  description?: string;
};

type CardSecret = {
  id: string;
  code: string;
  type: string;
  quota: number;
  validDays: number;
  status: "UNUSED" | "USED" | "EXPIRED";
  usedBy: string;
  createdAt: string;
  expiresAt: string;
};

type ManagedUser = {
  id: string;
  username: string;
  email: string;
  isDisabled: boolean;
  createdAt: string;
  membershipStatus?: string;
};

type Notice = {
  id: string;
  title: string;
  type: "系统通知" | "重要通知" | "功能更新" | "使用指南";
  status: "PUBLISHED" | "DRAFT";
  content: string;
  time: string;
};

type ApiItem = {
  id: string;
  name: string;
  endpoint: string;
  limit: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  custom?: boolean;
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
  { key: "data", label: "数据", icon: Gauge },
  { key: "cards", label: "卡密", icon: CreditCard },
  { key: "users", label: "用户", icon: Users },
  { key: "api", label: "API配置", icon: Code2 },
  { key: "notice", label: "公告", icon: Megaphone },
];

const initialCards: CardSecret[] = [
];

const initialNotices: Notice[] = [
];

const apiItems: ApiItem[] = [
  { id: "videoParseApiKey", name: "视频解析 API", endpoint: "videoParseApiBaseUrl", limit: "对应前端短视频提取、视频提取文案", icon: Rocket, accent: "blue" },
  { id: "contentApiKey", name: "文档转换 API", endpoint: "contentApiBaseUrl", limit: "对应前端 DOC/PDF/文案处理", icon: FileText, accent: "green" },
  { id: "speechApiKey", name: "语音转写 API", endpoint: "speechApiBaseUrl", limit: "对应前端音视频转文字", icon: Activity, accent: "violet" },
  { id: "imageApiKey", name: "图片生成 API", endpoint: "imageApiBaseUrl", limit: "对应前端图片/AI 绘图能力", icon: FileText, accent: "cyan" },
  { id: "smtpPassword", name: "注册邮件 SMTP", endpoint: "smtp.qq.com:465", limit: "按邮箱服务商限制", icon: Send, accent: "orange" },
];

const API_PRESETS = [
  { label: "视频解析 API", key: "videoParseApiKey", endpointKey: "videoParseApiBaseUrl", group: "video", placeholder: "https://..." },
  { label: "文档转换 API", key: "contentApiKey", endpointKey: "contentApiBaseUrl", group: "content", placeholder: "https://api.openai.com/v1" },
  { label: "语音转写 API", key: "speechApiKey", endpointKey: "speechApiBaseUrl", group: "speech", placeholder: "https://api.openai.com/v1" },
  { label: "图片生成 API", key: "imageApiKey", endpointKey: "imageApiBaseUrl", group: "image", placeholder: "https://api.openai.com/v1" },
  { label: "注册邮件 SMTP", key: "smtpPassword", endpointKey: "smtpHost", group: "mail", placeholder: "smtp.qq.com" },
  { label: "自定义功能 API", key: "custom", endpointKey: "", group: "custom", placeholder: "https://..." },
] as const;

function makeUsers(recent: AdminDashboard["recentUsers"]): ManagedUser[] {
  const fromData = recent.map((user, index) => ({
    id: user.id || `${100001 + index}`,
    username: user.username || user.email.split("@")[0],
    email: user.email,
    isDisabled: Boolean(user.isDisabled),
    createdAt: formatDateTime(user.createdAt),
  }));
  return fromData;
}

export default function AdminPage() {
  const [active, setActive] = useState<AdminTab>("data");
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [cards, setCards] = useState<CardSecret[]>(initialCards);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState("");

  useEffect(() => {
    setAuthenticated(Boolean(getToken()));
    setAdminAvatar(window.localStorage.getItem("lingxi_admin_avatar") ?? "");
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAdminData() {
      if (!authChecked) return;
      if (!authenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const [dashboardData, configData, usersData, cardsData, noticesData] = await Promise.all([
          apiJson<AdminDashboard>("/api/admin/dashboard"),
          apiJson<ApiConfig>("/api/admin/config"),
          apiJson<ManagedUser[]>("/api/admin/users"),
          apiJson<CardSecret[]>("/api/admin/cards"),
          apiJson<Notice[]>("/api/admin/announcements"),
        ]);
        if (!cancelled) {
          setDashboard(dashboardData);
          setApiConfig({ ...defaultApiConfig, ...configData });
          setUsers(usersData.length ? usersData.map((user) => ({ ...user, createdAt: formatDateTime(user.createdAt) })) : makeUsers(dashboardData.recentUsers));
          setCards(cardsData);
          setNotices(noticesData.map((notice) => ({ ...notice, time: formatDateTime(notice.time || "") })));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "后台数据加载失败";
          if (err instanceof ApiError && [401, 403].includes(err.status)) {
            window.localStorage.removeItem("lingxi_token");
            setAuthenticated(false);
          } else {
            setLoadError(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAdminData();
    return () => { cancelled = true; };
  }, [authChecked, authenticated]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function handleLogout() {
    window.localStorage.removeItem("lingxi_token");
    setDashboard(emptyDashboard);
    setApiConfig(defaultApiConfig);
    setAuthenticated(false);
  }

  if (!authChecked) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6f9ff] text-sm font-bold text-[#7482a3]">Loading...</main>;
  }

  if (!authenticated) {
    return <AdminLoginPanel onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <main className="admin-shell min-h-screen bg-[#f6f9ff] text-[#101936]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-[#e4ebf6] bg-white/92 shadow-[18px_0_42px_rgba(52,79,130,0.06)] backdrop-blur-xl">
        <div className="flex h-[88px] items-center gap-3 px-8">
          <Logo dark />
          <span className="text-[26px] font-black tracking-normal">灵析后台</span>
        </div>
        <nav className="mt-5 space-y-3 px-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = item.key === active;
            return (
              <button key={item.key} type="button" onClick={() => setActive(item.key)} className={`flex h-[52px] w-full items-center gap-4 rounded-lg px-5 text-[16px] font-bold transition ${selected ? "bg-[#176bff] text-white shadow-[0_14px_30px_rgba(23,107,255,0.28)]" : "text-[#53617d] hover:bg-[#eef5ff] hover:text-[#176bff]"}`}>
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-5 pb-7">
          <button type="button" onClick={() => notify("系统设置模块已打开，后续可接入站点基础信息配置")} className="flex h-12 w-full items-center gap-4 rounded-lg px-4 text-left text-[16px] font-bold text-[#53617d] transition hover:bg-[#eef5ff] hover:text-[#176bff]">
            <Settings className="h-5 w-5" />
            系统设置
          </button>
        </div>
      </aside>

      <section className="pl-[244px]">
        <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between border-b border-[#e4ebf6] bg-white/90 px-10 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-sm font-bold text-[#7b88a4]">
            <span>{navItems.find((item) => item.key === active)?.label}</span>
            <span>/</span>
            <span className="text-[#101936]">{active === "data" ? "数据看板" : active === "api" ? "配置中心" : "管理"}</span>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex h-12 w-[420px] items-center gap-3 rounded-lg border border-[#dce6f5] bg-white px-4 text-[#8b98b2] shadow-sm">
              <Search className="h-5 w-5" />
              <input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa8c0]" placeholder="搜索功能、用户、接口等..." />
              <span className="rounded border border-[#e3eaf6] px-1.5 py-0.5 text-xs font-black">⌘ K</span>
            </label>
            <button type="button" onClick={() => notify("暂无新的系统通知")} className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#1d2a44] transition hover:bg-[#eef5ff]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#176bff]" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-[#eef5ff]">
                <label className="flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#eef3fb] text-sm font-black">
                  {adminAvatar ? <span aria-label="管理员头像" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${adminAvatar})` }} /> : "管"}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const value = String(reader.result || "");
                      setAdminAvatar(value);
                      window.localStorage.setItem("lingxi_admin_avatar", value);
                      notify("管理员头像已更新");
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                <span className="font-bold text-[#33415f]">管理员</span>
                <button type="button" onClick={() => setAdminMenuOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white"><ChevronDown className="h-4 w-4 text-[#7b88a4]" /></button>
              </div>
              {adminMenuOpen ? (
                <div className="absolute right-0 top-[54px] w-44 overflow-hidden rounded-lg border border-[#e3ebf6] bg-white py-2 shadow-[0_18px_42px_rgba(39,76,135,0.16)]">
                  <button type="button" onClick={() => { setPasswordModalOpen(true); setAdminMenuOpen(false); }} className="block w-full px-4 py-2 text-left text-sm font-bold text-[#53617d] hover:bg-[#f8fbff] hover:text-[#176bff]">修改密码</button>
                  <button type="button" onClick={() => notify("操作日志模块后续可接入审计表")} className="block w-full px-4 py-2 text-left text-sm font-bold text-[#53617d] hover:bg-[#f8fbff] hover:text-[#176bff]">操作日志</button>
                  <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">退出登录</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="px-10 py-8">
          {loadError ? <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{loadError}</div> : null}
          {active === "data" ? <DashboardPanel data={dashboard} loading={loading} onAction={notify} /> : null}
          {active === "cards" ? <CardsPanel cards={cards} setCards={setCards} onAction={notify} /> : null}
          {active === "users" ? <UsersPanel users={users} setUsers={setUsers} query={globalQuery} onAction={notify} /> : null}
          {active === "api" ? <ApiPanel config={apiConfig} onSaved={setApiConfig} onAction={notify} /> : null}
          {active === "notice" ? <NoticePanel notices={notices} setNotices={setNotices} onAction={notify} /> : null}
        </div>
      </section>

      {toast ? <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#101936] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(16,25,54,0.22)]">{toast}</div> : null}
      {passwordModalOpen ? <PasswordModal onClose={() => setPasswordModalOpen(false)} onAction={notify} /> : null}
    </main>
  );
}

function AdminLoginPanel({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await apiJson<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.user.is_admin) {
        window.localStorage.removeItem("lingxi_token");
        setError("当前账号不是管理员，请使用后台管理员邮箱登录");
        return;
      }
      setToken(response.access_token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请检查账号和密码");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#eef6ff,#f7fbff)] px-6 text-[#111936]">
      <section className="w-full max-w-[440px] rounded-xl border border-[#dce6f5] bg-white p-8 shadow-[0_24px_70px_rgba(39,76,135,0.12)]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Logo dark />
          <span className="text-2xl font-black">灵析后台</span>
        </div>
        <form onSubmit={(event) => void submitLogin(event)} className="space-y-4">
          <AdminField label="管理员邮箱"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input" placeholder="admin@qq.com" required /></AdminField>
          <AdminField label="管理员密码"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="admin-input" placeholder="请输入后台密码" required /></AdminField>
          {error ? <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
          <button type="submit" disabled={submitting} className="admin-primary h-12 w-full disabled:cursor-not-allowed disabled:bg-[#8ba3c8]">{submitting ? "登录中..." : "登录后台"}</button>
        </form>
        <Link href="/" className="mt-5 flex h-10 items-center justify-center rounded-lg text-sm font-bold text-[#176bff] hover:bg-blue-50">返回官网</Link>
      </section>
    </main>
  );
}

function DashboardPanel({ data, loading, onAction }: { data: AdminDashboard; loading: boolean; onAction: (message: string) => void }) {
  const [range, setRange] = useState<TrendRange>("近7天");
  const rangeSize = range === "近一天" ? 1 : range === "近一个月" ? 30 : 7;
  const trendRows = data.trend.slice(-rangeSize);
  const totalRequests = data.trend.reduce((sum, item) => sum + item.requests, 0);
  const stats = [
    { label: "总用户数", value: data.stats.totalUsers, sub: `今日新增 ${data.stats.newUsersToday}`, icon: UserRound, tone: "blue" },
    { label: "今日请求数", value: data.stats.todayRequests, sub: `昨日 ${data.stats.yesterdayRequests}`, icon: Activity, tone: "violet" },
    { label: "总请求次数", value: totalRequests, sub: "来自真实任务表", icon: Clipboard, tone: "cyan" },
    { label: "API成功率", value: `${data.stats.apiSuccessRate}%`, sub: "基于真实任务状态", icon: ShieldCheck, tone: "green" },
  ];
  return (
    <div className="space-y-6">
      <PageTitle title="数据看板" desc="实时查看平台整体数据概览" action={<button type="button" onClick={() => onAction("数据已刷新")} className="admin-secondary"><RefreshCw className="h-4 w-4" />刷新数据</button>} />
      <div className="grid grid-cols-4 gap-6">{stats.map((item) => <MetricCard key={item.label} {...item} />)}</div>
      <div className="grid grid-cols-[1.45fr_1fr] gap-6">
        <Panel title="请求趋势" action={<SelectBox value={range} onChange={(value) => setRange(value as TrendRange)} options={["近一天", "近7天", "近一个月"]} />}>
          <TrendChart data={trendRows} loading={loading} />
        </Panel>
        <Panel title="请求来源分布">
          {data.moduleShares.length ? <DonutPanel data={data.moduleShares} /> : <EmptyState text="暂无真实请求来源数据" />}
        </Panel>
      </div>
      <Panel title="功能使用排行" action={<button type="button" onClick={() => onAction("已展开全部排行")} className="text-sm font-black text-[#176bff]">查看全部</button>}>
        {data.functionRank?.length ? (
          <div className="grid grid-cols-5 gap-5">
            {data.functionRank.map((item, index) => <RankCard key={item.type} rank={index + 1} name={item.name} count={item.count} share={item.share} />)}
          </div>
        ) : <EmptyState text="暂无真实功能使用数据" />}
      </Panel>
    </div>
  );
}

function CardsPanel({ cards, setCards, onAction }: { cards: CardSecret[]; setCards: (cards: CardSecret[]) => void; onAction: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const [generateOpen, setGenerateOpen] = useState(false);
  const filtered = cards.filter((card) => (status === "全部状态" || cardStatusLabel(card.status) === status) && (type === "全部类型" || card.type === type) && card.code.toLowerCase().includes(query.toLowerCase()));
  async function deleteCard(id: string) {
    await apiJson(`/api/admin/cards/${id}`, { method: "DELETE" });
    setCards(cards.filter((item) => item.id !== id));
    onAction("卡密已删除");
  }
  return (
    <div className="space-y-6">
      <PageTitle title="卡密管理" desc="管理平台卡密，支持生成、查询、导出与操作" action={<div className="flex gap-3"><button type="button" onClick={() => exportCsv("lingxi-cards.csv", cards.map((card) => ({ code: card.code, type: card.type, quota: card.quota, validDays: card.validDays, status: cardStatusLabel(card.status), usedBy: card.usedBy, createdAt: formatDateTime(card.createdAt), expiresAt: formatDateTime(card.expiresAt) })))} className="admin-secondary"><Download className="h-4 w-4" />导出记录</button><button type="button" onClick={() => setGenerateOpen(true)} className="admin-primary"><Plus className="h-4 w-4" />生成卡密</button></div>} />
      <div className="grid grid-cols-4 gap-5">
        <SummaryCard icon={CreditCard} label="卡密总数" value={cards.length} tone="blue" />
        <SummaryCard icon={FileText} label="未使用" value={cards.filter((card) => card.status === "UNUSED").length} tone="slate" />
        <SummaryCard icon={Check} label="已使用" value={cards.filter((card) => card.status === "USED").length} tone="green" />
        <SummaryCard icon={RefreshCw} label="已过期" value={cards.filter((card) => card.status === "EXPIRED").length} tone="red" />
      </div>
      <FilterBar>
        <SearchBox value={query} onChange={setQuery} placeholder="请输入卡密或备注" />
        <SelectBox value={status} onChange={setStatus} options={["全部状态", "未使用", "已使用", "已过期"]} />
        <SelectBox value={type} onChange={setType} options={["全部类型", "日卡", "周卡", "月卡", "季卡", "年卡", "体验卡"]} />
        <button type="button" onClick={() => onAction(`查询到 ${filtered.length} 条卡密`)} className="admin-primary ml-auto">查询</button>
      </FilterBar>
      <Panel title="">
        <AdminTable headers={["卡密", "类型", "面值 / 次数", "状态", "使用人", "创建时间", "过期时间", "操作"]}>
          {filtered.map((card) => (
            <tr key={card.id} className="admin-tr">
              <td>{card.code}</td><td>{card.type}</td><td>{card.quota} 次</td><td><StatusBadge value={cardStatusLabel(card.status)} /></td><td>{card.usedBy || "-"}</td><td>{formatDateTime(card.createdAt)}</td><td>{formatDateTime(card.expiresAt)}</td>
              <td><ActionGroup actions={[["详情", () => onAction(`卡密 ${card.code}：${cardStatusLabel(card.status)}`)], ["复制", () => copyText(card.code, onAction)], ["删除", () => void deleteCard(card.id)]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="30 条/页" />
      </Panel>
      {generateOpen ? <GenerateCardModal onClose={() => setGenerateOpen(false)} onCreated={(created) => { setCards([...created, ...cards]); setGenerateOpen(false); onAction(`已生成 ${created.length} 张卡密`); }} /> : null}
    </div>
  );
}

function UsersPanel({ users, setUsers, query, onAction }: { users: ManagedUser[]; setUsers: (users: ManagedUser[]) => void; query: string; onAction: (message: string) => void }) {
  const [localQuery, setLocalQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [viewing, setViewing] = useState<ManagedUser | null>(null);
  const keyword = (localQuery || query).toLowerCase();
  const filtered = users.filter((user) => (status === "全部状态" || (user.isDisabled ? "已禁用" : "正常") === status) && [user.id, user.username, user.email].some((value) => value.toLowerCase().includes(keyword)));
  async function toggleUser(user: ManagedUser) {
    const updated = await apiJson<ManagedUser>(`/api/admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ is_disabled: !user.isDisabled }) });
    setUsers(users.map((item) => item.id === user.id ? { ...item, isDisabled: updated.isDisabled } : item));
    onAction(updated.isDisabled ? "用户已禁用，将被强制退出" : "用户已启用");
  }
  async function resetPassword(user: ManagedUser) {
    const result = await apiJson<{ temporaryPassword: string }>(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    copyText(result.temporaryPassword, onAction, "密码已重置为 123456789，并已复制");
  }
  return (
    <div className="space-y-6">
      <PageTitle title="用户管理" desc="管理平台注册账号，查看用户信息与使用状态" action={<button type="button" onClick={() => exportCsv("lingxi-users.csv", users.map((user) => ({ id: user.id, username: user.username, email: user.email, status: user.isDisabled ? "已禁用" : "正常", membershipStatus: user.membershipStatus || "FREE", createdAt: user.createdAt })))} className="admin-secondary"><Download className="h-4 w-4" />导出用户</button>} />
      <FilterBar>
        <SearchBox value={localQuery} onChange={setLocalQuery} placeholder="请输入用户名或邮箱" />
        <SelectBox value={status} onChange={setStatus} options={["全部状态", "正常", "已禁用"]} />
        <button type="button" onClick={() => onAction(`搜索到 ${filtered.length} 个用户`)} className="admin-primary ml-auto">搜索</button>
      </FilterBar>
      <Panel title="">
        <AdminTable headers={["用户ID", "用户名", "邮箱", "状态", "注册时间", "操作"]}>
          {filtered.map((user) => (
            <tr key={user.id} className="admin-tr">
              <td>{user.id}</td><td>{user.username}</td><td>{user.email}</td><td><StatusBadge value={user.isDisabled ? "已禁用" : "正常"} /></td><td>{user.createdAt}</td>
              <td><ActionGroup actions={[["查看", () => setViewing(user)], ["重置密码", () => void resetPassword(user)], [user.isDisabled ? "启用" : "禁用", () => void toggleUser(user)]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="10 条/页" />
      </Panel>
      {viewing ? <UserDetailModal user={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

function ApiPanel({ config: initialConfig, onSaved, onAction }: { config: ApiConfig; onSaved: (config: ApiConfig) => void; onAction: (message: string) => void }) {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);
  const [editing, setEditing] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  useEffect(() => setConfig(initialConfig), [initialConfig]);
  const allApiItems: ApiItem[] = [
    ...apiItems,
    ...((config.customFields as CustomConfigField[] | undefined) ?? []).map((field) => ({
      id: field.key,
      name: field.label,
      endpoint: field.placeholder || "自定义配置",
      limit: field.group,
      icon: Code2,
      accent: "slate",
      custom: true,
    })),
  ];
  async function patchConfig(key: string, value: string) {
    const saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PATCH", body: JSON.stringify({ key, value }) });
    const next = { ...defaultApiConfig, ...saved };
    setConfig(next);
    onSaved(next);
    return next;
  }
  async function saveConfig(label = "配置") {
    try {
      const saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PUT", body: JSON.stringify(stripBuiltInConfig(config)) });
      const next = { ...defaultApiConfig, ...saved };
      setConfig(next);
      onSaved(next);
      onAction(`${label}已保存到后端`);
    } catch (err) {
      onAction(err instanceof Error ? err.message : `${label}保存失败`);
    }
  }
  async function testConfig(label: string, key: string) {
    try {
      const result = await apiJson<{ ok: boolean; message: string }>(`/api/admin/config/test/${String(key)}`, { method: "POST" });
      onAction(`${label}：${result.message}`);
    } catch (err) {
      onAction(err instanceof Error ? err.message : `${label}测试失败`);
    }
  }
  return (
    <div className="space-y-6">
      <PageTitle title="API配置" desc="管理系统对接的第三方 API 接口配置，支持新增、编辑、测试与删除。" action={<button type="button" onClick={() => setCustomOpen(true)} className="admin-primary"><Plus className="h-4 w-4" />新增配置</button>} />
      <div className="space-y-4">
        {allApiItems.map((item) => {
          const Icon = item.icon;
          const configured = Boolean(String(config[item.id] ?? ""));
          const endpoint = item.endpoint.endsWith("BaseUrl") || item.endpoint === "smtpHost" ? String(config[item.endpoint] || item.endpoint) : item.endpoint;
          return (
            <section key={item.id} className="flex min-h-[150px] items-center rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">
              <div className={`mr-6 flex h-24 w-24 items-center justify-center rounded-xl border bg-[#f8fbff] ${accentText(item.accent)}`}><Icon className="h-10 w-10" /></div>
              <div className="min-w-0 flex-1 border-l border-[#e4ebf6] pl-6">
                <div className="flex items-center gap-3"><h3 className="text-lg font-black">{item.name}</h3><StatusBadge value={configured ? "已启用" : "未配置"} /></div>
                <InfoRow label="接口地址" value={endpoint || "未配置"} link />
                <InfoRow label="请求限制" value={item.limit} />
                <InfoRow label="更新时间" value={config.updatedAt ? formatDateTime(config.updatedAt) : "暂无"} />
              </div>
              <div className="ml-8 flex items-center gap-5 border-l border-[#e4ebf6] pl-8">
                <IconButton label="编辑" icon={Pencil} onClick={() => setEditing(item.id)} />
                <IconButton label="测试" icon={Rocket} onClick={() => void testConfig(item.name, item.id)} />
                <IconButton label="删除" icon={Trash2} danger onClick={() => {
                  void apiJson<ApiConfig>(`/api/admin/config/${encodeURIComponent(item.id)}`, { method: "DELETE" })
                    .then((saved) => {
                      const next = { ...defaultApiConfig, ...saved };
                      setConfig(next);
                      onSaved(next);
                      onAction(`${item.name}已删除`);
                    })
                    .catch((err) => onAction(err instanceof Error ? err.message : "删除失败"));
                }} />
              </div>
            </section>
          );
        })}
      </div>
      <Panel title="邮件 SMTP 配置">
        <div className="grid grid-cols-3 gap-4">
          <AdminField label="SMTP 服务器"><input className="admin-input" value={config.smtpHost} onChange={(event) => setConfig({ ...config, smtpHost: event.target.value })} placeholder="smtp.qq.com" /></AdminField>
          <AdminField label="SMTP 端口"><input className="admin-input" value={config.smtpPort} onChange={(event) => setConfig({ ...config, smtpPort: event.target.value })} placeholder="465" /></AdminField>
          <AdminField label="发信邮箱"><input className="admin-input" value={config.smtpUser} onChange={(event) => setConfig({ ...config, smtpUser: event.target.value })} placeholder="example@qq.com" /></AdminField>
          <AdminField label="加密方式"><input className="admin-input" value={config.smtpSecure} onChange={(event) => setConfig({ ...config, smtpSecure: event.target.value })} placeholder="ssl" /></AdminField>
          <AdminField label="发件人名称"><input className="admin-input" value={config.smtpFromName} onChange={(event) => setConfig({ ...config, smtpFromName: event.target.value })} placeholder="灵析" /></AdminField>
          <AdminField label="SMTP 授权密码"><SecretInput value={config.smtpPassword} visible={visible.smtpPassword} onToggle={() => setVisible({ ...visible, smtpPassword: !visible.smtpPassword })} onChange={(value) => setConfig({ ...config, smtpPassword: value })} /></AdminField>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => void testConfig("SMTP 邮件", "smtpPassword")} className="admin-secondary">测试 SMTP</button>
          <button type="button" onClick={() => void saveConfig("SMTP 配置")} className="admin-primary"><Save className="h-4 w-4" />保存 SMTP 配置</button>
        </div>
      </Panel>
      <button type="button" onClick={() => void saveConfig("全部配置")} className="admin-primary h-12 w-full"><Save className="h-4 w-4" />保存所有配置</button>
      {editing ? <EditConfigModal item={allApiItems.find((item) => item.id === editing)} config={config} onClose={() => setEditing(null)} onSave={(key, value, endpointKey, endpointValue) => {
        void (async () => {
          await patchConfig(key, value);
          if (endpointKey) await patchConfig(endpointKey, endpointValue);
          setEditing(null);
          onAction("API 配置已保存");
        })().catch((err) => onAction(err instanceof Error ? err.message : "保存失败"));
      }} /> : null}
      {customOpen ? <CustomConfigModal onClose={() => setCustomOpen(false)} onSaved={(saved) => { const next = { ...defaultApiConfig, ...saved }; setConfig(next); onSaved(next); setCustomOpen(false); onAction("自定义配置已新增"); }} /> : null}
    </div>
  );
}

function NoticePanel({ notices, setNotices, onAction }: { notices: Notice[]; setNotices: (notices: Notice[]) => void; onAction: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [editing, setEditing] = useState<Notice | null>(null);
  const filtered = notices.filter((notice) => (status === "全部状态" || noticeStatusLabel(notice.status) === status) && notice.title.includes(query));
  async function saveNotice(notice: Notice) {
    const payload = { title: notice.title, type: notice.type, status: notice.status, content: notice.content };
    const exists = notices.some((item) => item.id === notice.id);
    const saved = await apiJson<Notice>(exists ? `/api/admin/announcements/${notice.id}` : "/api/admin/announcements", {
      method: exists ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    if (exists) setNotices(notices.map((item) => item.id === notice.id ? { ...saved, time: formatDateTime(saved.time) } : item));
    else setNotices([{ ...saved, time: formatDateTime(saved.time) }, ...notices]);
    setEditing(null);
    onAction("公告已保存");
  }
  async function deleteNotice(id: string) {
    await apiJson(`/api/admin/announcements/${id}`, { method: "DELETE" });
    setNotices(notices.filter((item) => item.id !== id));
    onAction("公告已删除");
  }
  return (
    <div className="space-y-6">
      <PageTitle title="公告管理" desc="发布和管理平台公告，及时向用户传达重要信息。" action={<button type="button" onClick={() => setEditing({ id: `${Date.now()}`, title: "", type: "系统通知", status: "DRAFT", content: "", time: nowText() })} className="admin-primary"><Plus className="h-4 w-4" />新建公告</button>} />
      <FilterBar>
        <SearchBox value={query} onChange={setQuery} placeholder="请输入公告标题" />
        <SelectBox value={status} onChange={setStatus} options={["全部状态", "已发布", "草稿"]} />
        <button type="button" onClick={() => { setQuery(""); setStatus("全部状态"); }} className="admin-secondary ml-auto">重置</button>
        <button type="button" onClick={() => onAction(`查询到 ${filtered.length} 条公告`)} className="admin-primary">搜索</button>
      </FilterBar>
      <Panel title="">
        <AdminTable headers={["标题", "类型", "状态", "发布时间", "操作"]}>
          {filtered.map((notice) => (
            <tr key={notice.id} className="admin-tr">
              <td>{notice.title}</td><td><TypeBadge value={notice.type} /></td><td><StatusBadge value={noticeStatusLabel(notice.status)} /></td><td>{notice.time}</td>
              <td><ActionGroup actions={[["编辑", () => setEditing(notice)], ["删除", () => void deleteNotice(notice.id)]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="10 条/页" />
      </Panel>
      {editing ? <NoticeModal notice={editing} onClose={() => setEditing(null)} onSave={(notice) => void saveNotice(notice)} /> : null}
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, tone }: { label: string; value: string | number; sub: string; icon: ComponentType<{ className?: string }>; tone: string }) {
  return <section className="flex items-center gap-5 rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]"><div className={`flex h-16 w-16 items-center justify-center rounded-full ${toneBg(tone)}`}><Icon className={`h-8 w-8 ${accentText(tone)}`} /></div><div><div className="text-sm font-bold text-[#7b88a4]">{label}</div><div className="mt-2 text-[30px] font-black leading-none">{typeof value === "number" ? formatNumber(value) : value}</div><div className="mt-3 text-sm font-bold text-[#667693]">{sub}</div></div></section>;
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: number; tone: string }) {
  return <section className="flex items-center gap-5 rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]"><div className={`flex h-14 w-14 items-center justify-center rounded-lg ${toneBg(tone)}`}><Icon className={`h-7 w-7 ${accentText(tone)}`} /></div><div><div className="text-sm font-bold text-[#7b88a4]">{label}</div><div className="mt-2 text-[26px] font-black">{formatNumber(value)}</div></div></section>;
}

function TrendChart({ data, loading }: { data: AdminDashboard["trend"]; loading: boolean }) {
  if (loading) return <EmptyState text="正在加载趋势数据..." />;
  const rows = data;
  if (!rows.length || rows.every((item) => item.requests === 0)) return <EmptyState text="暂无真实请求趋势数据" />;
  const max = Math.max(...rows.map((item) => item.requests), 1);
  const points = rows.map((item, index) => ({ ...item, x: 40 + index * (640 / Math.max(rows.length - 1, 1)), y: 230 - (item.requests / max) * 185 }));
  const path = buildSmoothPath(points);
  return <svg viewBox="0 0 730 260" className="h-[310px] w-full"><defs><linearGradient id="adminTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#176bff" stopOpacity="0.22" /><stop offset="100%" stopColor="#176bff" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3, 4].map((line) => <line key={line} x1="40" x2="690" y1={45 + line * 46} y2={45 + line * 46} stroke="#e7edf7" strokeDasharray="5 5" />)}<path d={`${path} L ${points[points.length - 1].x} 240 L ${points[0].x} 240 Z`} fill="url(#adminTrend)" /><path d={path} fill="none" stroke="#176bff" strokeWidth="4" strokeLinecap="round" />{points.map((point) => <g key={point.date}><circle cx={point.x} cy={point.y} r="6" fill="#176bff" stroke="#fff" strokeWidth="4" /><text x={point.x} y="255" textAnchor="middle" className="fill-[#53617d] text-xs">{point.date}</text></g>)}</svg>;
}

function DonutPanel({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;
  const colors = ["#176bff", "#43d1bd", "#8d6bff", "#ff9f2d", "#b6c2d5"];
  const gradient = data.map((item, index) => { const end = start + (item.value / total) * 100; const segment = `${colors[index % colors.length]} ${start}% ${end}%`; start = end; return segment; }).join(", ");
  return <div className="grid min-h-[310px] grid-cols-[220px_1fr] items-center gap-8"><div className="mx-auto h-[190px] w-[190px] rounded-full" style={{ background: `conic-gradient(${gradient})` }}><div className="relative left-[48px] top-[48px] h-[94px] w-[94px] rounded-full bg-white" /></div><div className="space-y-4">{data.map((item, index) => <div key={item.name} className="grid grid-cols-[1fr_64px] items-center gap-4 text-sm"><span className="flex items-center gap-3 font-bold text-[#53617d]"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{item.name}</span><span className="text-right font-black">{formatPercent(item.value, total)}</span></div>)}</div></div>;
}

function RankCard({ rank, name, count, share }: { rank: number; name: string; count: number; share: number }) {
  return <div className="relative rounded-lg border border-[#e3ebf6] bg-[#fbfdff] p-5"><span className={`absolute left-5 top-5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${rank <= 3 ? "bg-[#ff9f2d]" : "bg-[#667693]"}`}>{rank}</span><div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5ff] text-[#176bff]"><FileText className="h-7 w-7" /></div><div className="mt-4 text-center font-black">{name}</div><div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-[#667693]"><div>使用次数<br /><b className="text-[#53617d]">{formatNumber(count)}</b></div><div>占比<br /><b className="text-[#53617d]">{share.toFixed(1)}%</b></div></div></div>;
}

function SecretInput({ value, visible, onToggle, onChange }: { value: string; visible?: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return <span className="flex h-11 items-center rounded-lg border border-[#dce6f5] bg-white px-4 transition focus-within:border-[#176bff] focus-within:ring-4 focus-within:ring-blue-50"><input className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none" type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder="请输入密钥或授权码" /><button type="button" onClick={onToggle} className="ml-3 text-[#8b98b2]">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>;
}

function EditConfigModal({ item, config, onClose, onSave }: { item?: ApiItem; config: ApiConfig; onClose: () => void; onSave: (key: string, value: string, endpointKey: string, endpointValue: string) => void }) {
  const key = item?.id || "";
  const endpointKey = item && (item.endpoint.endsWith("BaseUrl") || item.endpoint === "smtpHost") ? item.endpoint : "";
  const [value, setValue] = useState(String(config[key] || ""));
  const [endpointValue, setEndpointValue] = useState(endpointKey ? String(config[endpointKey] || "") : item?.endpoint || "");
  return <Modal title="编辑 API 配置" onClose={onClose}><div className="space-y-4"><AdminField label="配置名称"><input className="admin-input" value={item?.name || key} readOnly /></AdminField><AdminField label="配置键"><input className="admin-input font-mono" value={key} readOnly /></AdminField>{endpointKey ? <AdminField label="接口地址"><input className="admin-input" value={endpointValue} onChange={(event) => setEndpointValue(event.target.value)} placeholder="请输入接口 Base URL 或 SMTP 主机" /></AdminField> : null}<AdminField label="API 密钥 / 授权值"><textarea className="min-h-[120px] w-full rounded-lg border border-[#dce6f5] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[#176bff] focus:ring-4 focus:ring-blue-50" value={value} onChange={(event) => setValue(event.target.value)} placeholder="请输入真实可用的 API Key、Cookie 或授权码" /></AdminField></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" onClick={() => onSave(key, value, endpointKey, endpointValue)} className="admin-primary"><Save className="h-4 w-4" />保存</button></div></Modal>;
}

function GenerateCardModal({ onClose, onCreated }: { onClose: () => void; onCreated: (cards: CardSecret[]) => void }) {
  const [type, setType] = useState("月卡");
  const [quota, setQuota] = useState(300);
  const [count, setCount] = useState(10);
  const [validDays, setValidDays] = useState(30);
  const [prefix, setPrefix] = useState("LK");
  const [submitting, setSubmitting] = useState(false);
  const typeDays: Record<string, number> = { 日卡: 1, 周卡: 7, 月卡: 30, 季卡: 90, 年卡: 365, 体验卡: 3 };
  async function submit() {
    setSubmitting(true);
    try {
      const result = await apiJson<{ cards: CardSecret[] }>("/api/admin/cards/generate", { method: "POST", body: JSON.stringify({ type, quota, count, valid_days: validDays, prefix }) });
      onCreated(result.cards);
    } finally {
      setSubmitting(false);
    }
  }
  return <Modal title="生成卡密" onClose={onClose}><div className="grid grid-cols-2 gap-4"><AdminField label="卡密类型"><SelectBox value={type} onChange={(value) => { setType(value); setValidDays(typeDays[value] ?? validDays); }} options={["日卡", "周卡", "月卡", "季卡", "年卡", "体验卡"]} /></AdminField><AdminField label="生成数量"><input className="admin-input" type="number" min={1} max={200} value={count} onChange={(event) => setCount(Number(event.target.value))} /></AdminField><AdminField label="可用次数 / 面值"><input className="admin-input" type="number" min={1} value={quota} onChange={(event) => setQuota(Number(event.target.value))} /></AdminField><AdminField label="多久不用自动过期（天）"><input className="admin-input" type="number" min={1} max={3650} value={validDays} onChange={(event) => setValidDays(Number(event.target.value))} /></AdminField><AdminField label="卡密前缀"><input className="admin-input" value={prefix} onChange={(event) => setPrefix(event.target.value)} /></AdminField></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" disabled={submitting} onClick={() => void submit()} className="admin-primary disabled:bg-[#8ba3c8]"><Plus className="h-4 w-4" />生成</button></div></Modal>;
}

function UserDetailModal({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
  return <Modal title="用户详情" onClose={onClose}><div className="grid grid-cols-2 gap-4 text-sm"><InfoBox label="用户 ID" value={user.id} /><InfoBox label="用户名" value={user.username} /><InfoBox label="邮箱" value={user.email} /><InfoBox label="账号状态" value={user.isDisabled ? "已禁用" : "正常"} /><InfoBox label="用户类型" value={user.membershipStatus || "FREE"} /><InfoBox label="注册时间" value={user.createdAt} /></div></Modal>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#e3ebf6] bg-[#f8fbff] p-4"><div className="text-xs font-black text-[#7b88a4]">{label}</div><div className="mt-2 break-all font-black text-[#101936]">{value}</div></div>;
}

function PasswordModal({ onClose, onAction }: { onClose: () => void; onAction: (message: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    setSubmitting(true);
    try {
      await apiJson("/api/admin/password", { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      onAction("管理员密码已修改");
      onClose();
    } catch (err) {
      onAction(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setSubmitting(false);
    }
  }
  return <Modal title="修改密码" onClose={onClose}><div className="space-y-4"><AdminField label="当前密码"><input className="admin-input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></AdminField><AdminField label="新密码"><input className="admin-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="至少 8 位" /></AdminField></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" disabled={submitting} onClick={() => void submit()} className="admin-primary disabled:bg-[#8ba3c8]"><Save className="h-4 w-4" />保存</button></div></Modal>;
}

function CustomConfigModal({ onClose, onSaved }: { onClose: () => void; onSaved: (config: ApiConfig) => void }) {
  const [presetLabel, setPresetLabel] = useState<string>(API_PRESETS[0].label);
  const preset: (typeof API_PRESETS)[number] = API_PRESETS.find((item) => item.label === presetLabel) ?? API_PRESETS[0];
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    setSubmitting(true);
    try {
      let saved: ApiConfig;
      if (preset.key === "custom") {
        saved = await apiJson<ApiConfig>("/api/admin/config/custom", { method: "POST", body: JSON.stringify({ key: key || name, label: name || "自定义 API", group: "custom", endpoint, value, secret: true, description: "后台新增的自定义 API 配置" }) });
      } else {
        saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PATCH", body: JSON.stringify({ key: preset.key, value }) });
        if (preset.endpointKey && endpoint) {
          saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PATCH", body: JSON.stringify({ key: preset.endpointKey, value: endpoint }) });
        }
      }
      onSaved(saved);
    } finally {
      setSubmitting(false);
    }
  }
  return <Modal title="新增 API 配置" onClose={onClose}><div className="space-y-4"><AdminField label="选择前端功能"><SelectBox value={presetLabel} onChange={setPresetLabel} options={API_PRESETS.map((item) => item.label)} /></AdminField>{preset.key === "custom" ? <div className="grid grid-cols-2 gap-4"><AdminField label="配置名称"><input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如 OCR 识别 API" /></AdminField><AdminField label="配置键"><input className="admin-input font-mono" value={key} onChange={(event) => setKey(event.target.value)} placeholder="ocrApiKey" /></AdminField></div> : <InfoBox label="将写入配置键" value={`${preset.key}${preset.endpointKey ? ` / ${preset.endpointKey}` : ""}`} />}<AdminField label="接口地址"><input className="admin-input" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder={preset.placeholder} /></AdminField><AdminField label="API 密钥 / 授权值"><textarea className="min-h-[120px] w-full rounded-lg border border-[#dce6f5] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[#176bff] focus:ring-4 focus:ring-blue-50" value={value} onChange={(event) => setValue(event.target.value)} placeholder="请输入真实 API Key、Cookie 或 SMTP 授权码" /></AdminField></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" disabled={submitting} onClick={() => void submit()} className="admin-primary disabled:bg-[#8ba3c8]"><Plus className="h-4 w-4" />新增配置</button></div></Modal>;
}

function NoticeModal({ notice, onClose, onSave }: { notice: Notice; onClose: () => void; onSave: (notice: Notice) => void }) {
  const [draft, setDraft] = useState(notice);
  return <Modal title="公告编辑" onClose={onClose}><div className="space-y-4"><AdminField label="公告标题"><input className="admin-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="请输入公告标题" /></AdminField><div className="grid grid-cols-2 gap-4"><AdminField label="类型"><SelectBox value={draft.type} onChange={(value) => setDraft({ ...draft, type: value as Notice["type"] })} options={["系统通知", "重要通知", "功能更新", "使用指南"]} /></AdminField><AdminField label="状态"><SelectBox value={noticeStatusLabel(draft.status)} onChange={(value) => setDraft({ ...draft, status: value === "已发布" ? "PUBLISHED" : "DRAFT" })} options={["已发布", "草稿"]} /></AdminField></div><AdminField label="公告内容"><textarea className="min-h-[160px] w-full resize-y rounded-lg border border-[#dce6f5] bg-white px-4 py-3 text-sm outline-none focus:border-[#176bff] focus:ring-4 focus:ring-blue-50" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="请输入公告正文，支持填写维护时间、影响范围、更新说明等内容" /></AdminField></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" onClick={() => onSave({ ...draft, time: draft.time || nowText() })} className="admin-primary"><Save className="h-4 w-4" />保存公告</button></div></Modal>;
}

function stripBuiltInConfig(config: ApiConfig) {
  const { updatedAt: _updatedAt, customFields: _customFields, ...payload } = config;
  const allowed = new Set([
    "contentApiKey", "contentApiBaseUrl", "contentModel",
    "imageApiKey", "imageApiBaseUrl", "imageModel",
    "speechApiKey", "speechApiBaseUrl", "speechModel",
    "copyExtractApiKey", "videoParseProvider", "videoParseApiKey", "videoParseApiBaseUrl",
    "rapidApiKey", "siliconflowApiKey", "biliCookie", "douyinCookie", "xhsCookie",
    "wechatSupportId", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpSecure", "smtpFromName",
  ]);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.has(key)));
}

function cardStatusLabel(status: CardSecret["status"] | string) {
  return { UNUSED: "未使用", USED: "已使用", EXPIRED: "已过期" }[status] ?? status;
}

function noticeStatusLabel(status: Notice["status"] | string) {
  return status === "PUBLISHED" ? "已发布" : "草稿";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatPercent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatDateTime(value: string) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.slice(1).reduce((path, point, index) => {
    const prev = points[index];
    const midX = (prev.x + point.x) / 2;
    return `${path} C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function toneBg(tone: string) {
  return { blue: "bg-blue-50", violet: "bg-violet-50", cyan: "bg-cyan-50", green: "bg-emerald-50", slate: "bg-slate-100", red: "bg-red-50", orange: "bg-orange-50" }[tone] ?? "bg-blue-50";
}

function accentText(tone: string) {
  return { blue: "text-[#176bff]", violet: "text-violet-500", cyan: "text-cyan-500", green: "text-emerald-500", slate: "text-slate-500", red: "text-red-500", orange: "text-orange-500" }[tone] ?? "text-[#176bff]";
}

function exportCsv(filename: string, rows: unknown[]) {
  const records = rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row));
  const headers = Array.from(records.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const escapeCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const text = [headers.join(","), ...records.map((row) => headers.map((key) => escapeCell(row[key])).join(","))].join("\n");
  const blob = new Blob([`\uFEFF${text}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function copyText(value: string, onAction: (message: string) => void, message = "已复制到剪贴板") {
  void navigator.clipboard.writeText(value);
  onAction(message);
}
