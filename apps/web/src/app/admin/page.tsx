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

import { apiJson, getToken, setToken, type AuthResponse } from "@/lib/api";
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

type CardSecret = {
  id: string;
  code: string;
  type: "月卡" | "季卡" | "年卡" | "体验卡";
  quota: string;
  status: "未使用" | "已使用" | "已过期";
  user: string;
  createdAt: string;
  expiresAt: string;
};

type ManagedUser = {
  id: string;
  username: string;
  email: string;
  status: "正常" | "已禁用";
  createdAt: string;
};

type Notice = {
  id: string;
  title: string;
  type: "系统通知" | "重要通知" | "功能更新" | "使用指南";
  status: "已发布" | "草稿";
  time: string;
};

type ApiItem = {
  id: keyof ApiConfig;
  name: string;
  endpoint: string;
  limit: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
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
  { id: "1", code: "LK20240520001", type: "月卡", quota: "100 次", status: "未使用", user: "-", createdAt: "2024-05-20 09:00:00", expiresAt: "2024-06-20 09:00:00" },
  { id: "2", code: "LK20240520002", type: "季卡", quota: "300 次", status: "未使用", user: "-", createdAt: "2024-05-20 09:00:00", expiresAt: "2024-08-20 09:00:00" },
  { id: "3", code: "LK20240520003", type: "年卡", quota: "1200 次", status: "已使用", user: "用户1234", createdAt: "2024-05-18 15:20:15", expiresAt: "2025-05-18 15:20:15" },
  { id: "4", code: "LK20240520004", type: "体验卡", quota: "10 次", status: "已过期", user: "用户2345", createdAt: "2024-04-20 10:30:30", expiresAt: "2024-04-27 10:30:30" },
];

const initialNotices: Notice[] = [
  { id: "1", title: "平台维护通知", type: "系统通知", status: "已发布", time: "2024-05-20 10:30:45" },
  { id: "2", title: "关于 API 接口调整的通知", type: "重要通知", status: "已发布", time: "2024-05-19 12:03:08" },
  { id: "3", title: "新功能上线：PDF 合并", type: "功能更新", status: "已发布", time: "2024-05-18 16:45:12" },
  { id: "4", title: "使用指南：新手教程", type: "使用指南", status: "草稿", time: "2024-05-17 09:15:33" },
];

const apiItems: ApiItem[] = [
  { id: "copyExtractApiKey", name: "视频提取 API", endpoint: "https://api.lingxi.com/video/extract", limit: "1000 次/分钟", icon: Rocket, accent: "blue" },
  { id: "contentApiKey", name: "文档转换 API", endpoint: "https://api.lingxi.com/doc/convert", limit: "2000 次/分钟", icon: FileText, accent: "green" },
  { id: "speechApiKey", name: "语音转写 API", endpoint: "https://api.lingxi.com/audio/transcribe", limit: "800 次/分钟", icon: Activity, accent: "violet" },
  { id: "smtpPassword", name: "注册邮件 SMTP", endpoint: "smtp.qq.com:465", limit: "按邮箱服务商限制", icon: Send, accent: "orange" },
];

function makeUsers(recent: AdminDashboard["recentUsers"]): ManagedUser[] {
  const fromData = recent.map((user, index) => ({
    id: `${100001 + index}`,
    username: user.email.split("@")[0],
    email: user.email,
    status: "正常" as const,
    createdAt: formatDateTime(user.createdAt),
  }));
  if (fromData.length) return fromData;
  return [
    { id: "100001", username: "admin", email: "1781586305@qq.com", status: "正常", createdAt: "2024-05-19 10:23:45" },
    { id: "100002", username: "api_user", email: "api_user@qq.com", status: "正常", createdAt: "2024-05-15 14:20:18" },
    { id: "100003", username: "guest_001", email: "guest001@qq.com", status: "已禁用", createdAt: "2024-05-11 21:33:12" },
  ];
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

  useEffect(() => {
    setAuthenticated(Boolean(getToken()));
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
        const [dashboardData, configData] = await Promise.all([
          apiJson<AdminDashboard>("/api/admin/dashboard"),
          apiJson<ApiConfig>("/api/admin/config"),
        ]);
        if (!cancelled) {
          setDashboard(dashboardData);
          setApiConfig({ ...defaultApiConfig, ...configData });
          setUsers(makeUsers(dashboardData.recentUsers));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "后台数据加载失败";
          if (["Authentication required", "Invalid token", "User not found", "Admin access required"].includes(message)) {
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
    <main className="min-h-screen min-w-[1180px] bg-[#f6f9ff] text-[#101936]">
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
            <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-[#eef5ff]" title="退出登录">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef3fb] text-sm font-black">管</div>
              <span className="font-bold text-[#33415f]">管理员</span>
              <ChevronDown className="h-4 w-4 text-[#7b88a4]" />
            </button>
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
  const totalRequests = data.trend.reduce((sum, item) => sum + item.requests, 0);
  const stats = [
    { label: "总用户数", value: data.stats.totalUsers || 12856, delta: "+12.5%", icon: UserRound, tone: "blue" },
    { label: "今日请求数", value: data.stats.todayRequests || 58265, delta: "+18.2%", icon: Activity, tone: "violet" },
    { label: "总请求次数", value: totalRequests || 1285632, delta: "+15.3%", icon: Clipboard, tone: "cyan" },
    { label: "API成功率", value: `${data.stats.apiSuccessRate || 100}%`, delta: "-3.2%", icon: ShieldCheck, tone: "green" },
  ];
  return (
    <div className="space-y-6">
      <PageTitle title="数据看板" desc="实时查看平台整体数据概览" action={<button type="button" onClick={() => onAction("数据已刷新")} className="admin-secondary"><RefreshCw className="h-4 w-4" />刷新数据</button>} />
      <div className="grid grid-cols-4 gap-6">{stats.map((item) => <MetricCard key={item.label} {...item} />)}</div>
      <div className="grid grid-cols-[1.45fr_1fr] gap-6">
        <Panel title="请求趋势" action={<button type="button" onClick={() => onAction("已切换到近7天")} className="admin-filter">近7天 <ChevronDown className="h-4 w-4" /></button>}>
          <TrendChart data={data.trend} loading={loading} />
        </Panel>
        <Panel title="请求来源分布">
          <DonutPanel data={data.moduleShares.length ? data.moduleShares : [{ name: "网页版", value: 46 }, { name: "API调用", value: 28 }, { name: "移动端", value: 15 }, { name: "其他", value: 11 }]} />
        </Panel>
      </div>
      <Panel title="功能使用排行" action={<button type="button" onClick={() => onAction("已展开全部排行")} className="text-sm font-black text-[#176bff]">查看全部</button>}>
        <div className="grid grid-cols-5 gap-5">
          {["智能创作", "PDF转换", "文档问答", "PDF合并", "数据查询"].map((name, index) => <RankCard key={name} rank={index + 1} name={name} />)}
        </div>
      </Panel>
    </div>
  );
}

function CardsPanel({ cards, setCards, onAction }: { cards: CardSecret[]; setCards: (cards: CardSecret[]) => void; onAction: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const filtered = cards.filter((card) => (status === "全部状态" || card.status === status) && (type === "全部类型" || card.type === type) && card.code.toLowerCase().includes(query.toLowerCase()));
  function generateCard() {
    const id = `${Date.now()}`;
    const next: CardSecret = { id, code: `LK${new Date().toISOString().slice(0, 10).replaceAll("-", "")}${String(cards.length + 1).padStart(4, "0")}`, type: "月卡", quota: "100 次", status: "未使用", user: "-", createdAt: nowText(), expiresAt: "30 天后" };
    setCards([next, ...cards]);
    onAction("已生成 1 张月卡");
  }
  return (
    <div className="space-y-6">
      <PageTitle title="卡密管理" desc="管理平台卡密，支持生成、查询、导出与操作" action={<div className="flex gap-3"><button type="button" onClick={() => exportCsv("lingxi-cards.csv", cards)} className="admin-secondary"><Download className="h-4 w-4" />导出记录</button><button type="button" onClick={generateCard} className="admin-primary"><Plus className="h-4 w-4" />生成卡密</button></div>} />
      <div className="grid grid-cols-4 gap-5">
        <SummaryCard icon={CreditCard} label="卡密总数" value={cards.length} tone="blue" />
        <SummaryCard icon={FileText} label="未使用" value={cards.filter((card) => card.status === "未使用").length} tone="slate" />
        <SummaryCard icon={Check} label="已使用" value={cards.filter((card) => card.status === "已使用").length} tone="green" />
        <SummaryCard icon={RefreshCw} label="已过期" value={cards.filter((card) => card.status === "已过期").length} tone="red" />
      </div>
      <FilterBar>
        <SearchBox value={query} onChange={setQuery} placeholder="请输入卡密或备注" />
        <SelectBox value={status} onChange={setStatus} options={["全部状态", "未使用", "已使用", "已过期"]} />
        <SelectBox value={type} onChange={setType} options={["全部类型", "月卡", "季卡", "年卡", "体验卡"]} />
        <button type="button" onClick={() => onAction(`查询到 ${filtered.length} 条卡密`)} className="admin-primary ml-auto">查询</button>
      </FilterBar>
      <Panel title="">
        <AdminTable headers={["卡密", "类型", "面值 / 次数", "状态", "使用人", "创建时间", "过期时间", "操作"]}>
          {filtered.map((card) => (
            <tr key={card.id} className="admin-tr">
              <td>{card.code}</td><td>{card.type}</td><td>{card.quota}</td><td><StatusBadge value={card.status} /></td><td>{card.user}</td><td>{card.createdAt}</td><td>{card.expiresAt}</td>
              <td><ActionGroup actions={[["详情", () => onAction(`卡密 ${card.code}：${card.status}`)], ["复制", () => copyText(card.code, onAction)], ["删除", () => setCards(cards.filter((item) => item.id !== card.id))]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="30 条/页" />
      </Panel>
    </div>
  );
}

function UsersPanel({ users, setUsers, query, onAction }: { users: ManagedUser[]; setUsers: (users: ManagedUser[]) => void; query: string; onAction: (message: string) => void }) {
  const [localQuery, setLocalQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const keyword = (localQuery || query).toLowerCase();
  const filtered = users.filter((user) => (status === "全部状态" || user.status === status) && [user.id, user.username, user.email].some((value) => value.toLowerCase().includes(keyword)));
  function toggleUser(id: string) {
    setUsers(users.map((user) => user.id === id ? { ...user, status: user.status === "正常" ? "已禁用" : "正常" } : user));
  }
  return (
    <div className="space-y-6">
      <PageTitle title="用户管理" desc="管理平台注册账号，查看用户信息与使用状态" action={<button type="button" onClick={() => exportCsv("lingxi-users.csv", users)} className="admin-secondary"><Download className="h-4 w-4" />导出用户</button>} />
      <FilterBar>
        <SearchBox value={localQuery} onChange={setLocalQuery} placeholder="请输入用户名或邮箱" />
        <SelectBox value={status} onChange={setStatus} options={["全部状态", "正常", "已禁用"]} />
        <button type="button" onClick={() => onAction(`搜索到 ${filtered.length} 个用户`)} className="admin-primary ml-auto">搜索</button>
      </FilterBar>
      <Panel title="">
        <AdminTable headers={["用户ID", "用户名", "邮箱", "状态", "注册时间", "操作"]}>
          {filtered.map((user) => (
            <tr key={user.id} className="admin-tr">
              <td>{user.id}</td><td>{user.username}</td><td>{user.email}</td><td><StatusBadge value={user.status} /></td><td>{user.createdAt}</td>
              <td><ActionGroup actions={[["查看", () => onAction(`${user.email} 注册于 ${user.createdAt}`)], ["重置密码", () => copyText("Lingxi@123456", onAction, "临时密码已复制")], [user.status === "正常" ? "禁用" : "启用", () => toggleUser(user.id)]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="10 条/页" />
      </Panel>
    </div>
  );
}

function ApiPanel({ config: initialConfig, onSaved, onAction }: { config: ApiConfig; onSaved: (config: ApiConfig) => void; onAction: (message: string) => void }) {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);
  const [editing, setEditing] = useState<keyof ApiConfig | "smtp" | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  useEffect(() => setConfig(initialConfig), [initialConfig]);
  async function saveConfig(label = "配置") {
    try {
      const saved = await apiJson<ApiConfig>("/api/admin/config", { method: "PUT", body: JSON.stringify(stripUpdatedAt(config)) });
      const next = { ...defaultApiConfig, ...saved };
      setConfig(next);
      onSaved(next);
      onAction(`${label}已保存到后端`);
    } catch (err) {
      onAction(err instanceof Error ? err.message : `${label}保存失败`);
    }
  }
  async function testConfig(label: string, key: keyof ApiConfig) {
    try {
      const result = await apiJson<{ ok: boolean; message: string }>(`/api/admin/config/test/${String(key)}`, { method: "POST" });
      onAction(`${label}：${result.message}`);
    } catch (err) {
      onAction(err instanceof Error ? err.message : `${label}测试失败`);
    }
  }
  return (
    <div className="space-y-6">
      <PageTitle title="API配置" desc="管理系统对接的第三方 API 接口配置，支持新增、编辑、测试与删除。" action={<button type="button" onClick={() => setEditing("contentApiKey")} className="admin-primary"><Plus className="h-4 w-4" />新增配置</button>} />
      <div className="space-y-4">
        {apiItems.map((item) => {
          const Icon = item.icon;
          const configured = Boolean(config[item.id]);
          return (
            <section key={item.id} className="flex min-h-[150px] items-center rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">
              <div className={`mr-6 flex h-24 w-24 items-center justify-center rounded-xl border bg-[#f8fbff] ${accentText(item.accent)}`}><Icon className="h-10 w-10" /></div>
              <div className="min-w-0 flex-1 border-l border-[#e4ebf6] pl-6">
                <div className="flex items-center gap-3"><h3 className="text-lg font-black">{item.name}</h3><StatusBadge value={configured ? "已启用" : "未配置"} /></div>
                <InfoRow label="接口地址" value={item.endpoint} link />
                <InfoRow label="请求限制" value={item.limit} />
                <InfoRow label="更新时间" value={config.updatedAt ? formatDateTime(config.updatedAt) : "暂无"} />
              </div>
              <div className="ml-8 flex items-center gap-5 border-l border-[#e4ebf6] pl-8">
                <IconButton label="编辑" icon={Pencil} onClick={() => setEditing(item.id)} />
                <IconButton label="测试" icon={Rocket} onClick={() => void testConfig(item.name, item.id)} />
                <IconButton label="删除" icon={Trash2} danger onClick={() => { setConfig({ ...config, [item.id]: "" }); onAction(`${item.name}已清空，点击保存后生效`); }} />
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
      {editing ? <EditConfigModal field={editing} config={config} setConfig={setConfig} onClose={() => setEditing(null)} onSave={() => { void saveConfig("API 配置"); setEditing(null); }} /> : null}
    </div>
  );
}

function NoticePanel({ notices, setNotices, onAction }: { notices: Notice[]; setNotices: (notices: Notice[]) => void; onAction: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [editing, setEditing] = useState<Notice | null>(null);
  const filtered = notices.filter((notice) => (status === "全部状态" || notice.status === status) && notice.title.includes(query));
  function saveNotice(notice: Notice) {
    if (notices.some((item) => item.id === notice.id)) setNotices(notices.map((item) => item.id === notice.id ? notice : item));
    else setNotices([notice, ...notices]);
    setEditing(null);
    onAction("公告已保存");
  }
  return (
    <div className="space-y-6">
      <PageTitle title="公告管理" desc="发布和管理平台公告，及时向用户传达重要信息。" action={<button type="button" onClick={() => setEditing({ id: `${Date.now()}`, title: "", type: "系统通知", status: "草稿", time: nowText() })} className="admin-primary"><Plus className="h-4 w-4" />新建公告</button>} />
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
              <td>{notice.title}</td><td><TypeBadge value={notice.type} /></td><td><StatusBadge value={notice.status} /></td><td>{notice.time}</td>
              <td><ActionGroup actions={[["编辑", () => setEditing(notice)], ["删除", () => setNotices(notices.filter((item) => item.id !== notice.id))]]} /></td>
            </tr>
          ))}
        </AdminTable>
        <Pagination total={filtered.length} pageSize="10 条/页" />
      </Panel>
      {editing ? <NoticeModal notice={editing} onClose={() => setEditing(null)} onSave={saveNotice} /> : null}
    </div>
  );
}

function PageTitle({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return <div className="flex items-end justify-between"><div><h1 className="text-[30px] font-black tracking-normal">{title}</h1><p className="mt-3 text-[15px] font-medium text-[#667693]">{desc}</p></div>{action}</div>;
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">{title || action ? <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2>{action}</div> : null}{children}</section>;
}

function MetricCard({ label, value, delta, icon: Icon, tone }: { label: string; value: string | number; delta: string; icon: ComponentType<{ className?: string }>; tone: string }) {
  return <section className="flex items-center gap-5 rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]"><div className={`flex h-16 w-16 items-center justify-center rounded-full ${toneBg(tone)}`}><Icon className={`h-8 w-8 ${accentText(tone)}`} /></div><div><div className="text-sm font-bold text-[#7b88a4]">{label}</div><div className="mt-2 text-[30px] font-black leading-none">{typeof value === "number" ? formatNumber(value) : value}</div><div className={`mt-3 text-sm font-bold ${delta.startsWith("-") ? "text-red-500" : "text-emerald-500"}`}>较昨日 {delta}</div></div></section>;
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: number; tone: string }) {
  return <section className="flex items-center gap-5 rounded-xl border border-[#e3ebf6] bg-white p-6 shadow-[0_14px_36px_rgba(39,76,135,0.08)]"><div className={`flex h-14 w-14 items-center justify-center rounded-lg ${toneBg(tone)}`}><Icon className={`h-7 w-7 ${accentText(tone)}`} /></div><div><div className="text-sm font-bold text-[#7b88a4]">{label}</div><div className="mt-2 text-[26px] font-black">{formatNumber(value)}</div></div></section>;
}

function TrendChart({ data, loading }: { data: AdminDashboard["trend"]; loading: boolean }) {
  const rows = data.length ? data : [{ date: "05-14", requests: 45000 }, { date: "05-15", requests: 49000 }, { date: "05-16", requests: 65000 }, { date: "05-17", requests: 46000 }, { date: "05-18", requests: 42000 }, { date: "05-19", requests: 50000 }, { date: "05-20", requests: 60000 }];
  if (loading) return <EmptyState text="正在加载趋势数据..." />;
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

function RankCard({ rank, name }: { rank: number; name: string }) {
  return <div className="relative rounded-lg border border-[#e3ebf6] bg-[#fbfdff] p-5"><span className={`absolute left-5 top-5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${rank <= 3 ? "bg-[#ff9f2d]" : "bg-[#667693]"}`}>{rank}</span><div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5ff] text-[#176bff]"><FileText className="h-7 w-7" /></div><div className="mt-4 text-center font-black">{name}</div><div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-[#667693]"><div>使用次数<br /><b className="text-[#53617d]">{formatNumber(86000 + rank * 24000)}</b></div><div>占比<br /><b className="text-[#53617d]">{(36 / rank).toFixed(1)}%</b></div></div></div>;
}

function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-4 rounded-xl border border-[#e3ebf6] bg-white p-5 shadow-[0_14px_36px_rgba(39,76,135,0.08)]">{children}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex h-11 w-[330px] items-center gap-3 rounded-lg border border-[#dce6f5] bg-white px-4 text-[#9aa8c0]"><Search className="h-5 w-5" /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={placeholder} /></label>;
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-[190px] appearance-none rounded-lg border border-[#dce6f5] bg-white px-4 text-sm font-bold text-[#53617d] outline-none"><>{options.map((option) => <option key={option}>{option}</option>)}</></select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-[#8b98b2]" /></label>;
}

function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-[#e3ebf6]"><table className="w-full text-left text-sm"><thead className="bg-[#f8fbff] text-[#53617d]"><tr>{headers.map((header) => <th key={header} className="px-5 py-4 font-black">{header}</th>)}</tr></thead><tbody className="text-[#33415f]">{children}</tbody></table></div>;
}

function ActionGroup({ actions }: { actions: Array<[string, () => void]> }) {
  return <div className="flex items-center gap-4">{actions.map(([label, action]) => <button key={label} type="button" onClick={action} className={`font-black transition ${label === "删除" || label === "禁用" ? "text-red-500 hover:text-red-600" : "text-[#176bff] hover:text-[#0f5bea]"}`}>{label}</button>)}</div>;
}

function Pagination({ total, pageSize }: { total: number; pageSize: string }) {
  return <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#667693]"><span>共 {total} 条</span><div className="flex items-center gap-3"><button type="button" className="admin-page"><ChevronLeft className="h-4 w-4" /></button><button type="button" className="admin-page border-[#176bff] text-[#176bff]">1</button><button type="button" className="admin-page"><ChevronRight className="h-4 w-4" /></button><button type="button" className="admin-filter">{pageSize}<ChevronDown className="h-4 w-4" /></button></div></div>;
}

function StatusBadge({ value }: { value: string }) {
  const good = ["正常", "未使用", "已发布", "已启用"].includes(value);
  const warn = ["草稿", "未配置"].includes(value);
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${good ? "bg-emerald-50 text-emerald-600" : warn ? "bg-slate-100 text-slate-500" : value === "已使用" ? "bg-blue-50 text-[#176bff]" : "bg-red-50 text-red-500"}`}>{value}</span>;
}

function TypeBadge({ value }: { value: string }) {
  const cls = value === "系统通知" ? "bg-blue-50 text-[#176bff]" : value === "重要通知" ? "bg-violet-50 text-violet-600" : value === "功能更新" ? "bg-orange-50 text-orange-500" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

function InfoRow({ label, value, link = false }: { label: string; value: string; link?: boolean }) {
  return <div className="mt-3 grid grid-cols-[90px_1fr] text-sm"><span className="font-bold text-[#7b88a4]">{label}</span><span className={`font-bold ${link ? "text-[#176bff]" : "text-[#33415f]"}`}>{value}</span></div>;
}

function IconButton({ label, icon: Icon, onClick, danger = false }: { label: string; icon: ComponentType<{ className?: string }>; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 text-sm font-black transition ${danger ? "text-red-500 hover:text-red-600" : "text-[#176bff] hover:text-[#0f5bea]"}`}><Icon className="h-4 w-4" />{label}</button>;
}

function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#53617d]">{label}</span>{children}</label>;
}

function SecretInput({ value, visible, onToggle, onChange }: { value: string; visible?: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return <span className="flex h-11 items-center rounded-lg border border-[#dce6f5] bg-white px-4 transition focus-within:border-[#176bff] focus-within:ring-4 focus-within:ring-blue-50"><input className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none" type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder="请输入密钥或授权码" /><button type="button" onClick={onToggle} className="ml-3 text-[#8b98b2]">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>;
}

function EditConfigModal({ field, config, setConfig, onClose, onSave }: { field: keyof ApiConfig | "smtp"; config: ApiConfig; setConfig: (config: ApiConfig) => void; onClose: () => void; onSave: () => void }) {
  const key = field === "smtp" ? "smtpPassword" : field;
  return <Modal title="编辑 API 配置" onClose={onClose}><AdminField label="配置值"><textarea className="min-h-[120px] w-full rounded-lg border border-[#dce6f5] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[#176bff] focus:ring-4 focus:ring-blue-50" value={String(config[key] || "")} onChange={(event) => setConfig({ ...config, [key]: event.target.value })} /></AdminField><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" onClick={onSave} className="admin-primary"><Save className="h-4 w-4" />保存</button></div></Modal>;
}

function NoticeModal({ notice, onClose, onSave }: { notice: Notice; onClose: () => void; onSave: (notice: Notice) => void }) {
  const [draft, setDraft] = useState(notice);
  return <Modal title="公告编辑" onClose={onClose}><div className="space-y-4"><AdminField label="公告标题"><input className="admin-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="请输入公告标题" /></AdminField><div className="grid grid-cols-2 gap-4"><AdminField label="类型"><SelectBox value={draft.type} onChange={(value) => setDraft({ ...draft, type: value as Notice["type"] })} options={["系统通知", "重要通知", "功能更新", "使用指南"]} /></AdminField><AdminField label="状态"><SelectBox value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as Notice["status"] })} options={["已发布", "草稿"]} /></AdminField></div></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="admin-secondary">取消</button><button type="button" onClick={() => onSave({ ...draft, time: draft.time || nowText() })} className="admin-primary"><Save className="h-4 w-4" />保存公告</button></div></Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101936]/30 px-6 backdrop-blur-sm"><section className="w-full max-w-[560px] rounded-xl bg-white p-6 shadow-[0_30px_90px_rgba(16,25,54,0.26)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#eef5ff]"><X className="h-5 w-5" /></button></div>{children}</section></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-[#dce6f5] bg-[#f8fbff] text-sm font-bold text-[#8b98b2]">{text}</div>;
}

function stripUpdatedAt(config: ApiConfig) {
  const { updatedAt: _updatedAt, ...payload } = config;
  return payload;
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
  const text = JSON.stringify(rows, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(".csv", ".json");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function copyText(value: string, onAction: (message: string) => void, message = "已复制到剪贴板") {
  void navigator.clipboard.writeText(value);
  onAction(message);
}
