"use client";

import { Cloud, Eye, FileText, Github, Lock, Mail, Play, Repeat2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Logo } from "@/app/components/SiteHeader";
import { apiJson, setToken, type AuthResponse } from "@/lib/api";

export function AuthCard({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "error">("error");
  const isLogin = mode === "login";

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = window.setTimeout(() => setCodeCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeCountdown]);

  function validateEmail() {
    const value = email.trim().toLowerCase();
    if (!value) return "请输入邮箱地址";
    if (!/^[^\s@]+@qq\.com$/.test(value)) return "目前仅支持 QQ 邮箱";
    return "";
  }

  async function submit() {
    setMessage("");
    setMessageTone("error");
    const emailError = validateEmail();
    if (emailError) {
      setMessage(emailError);
      return;
    }
    if (password.length < 8) {
      setMessage("密码至少需要 8 位");
      return;
    }
    if (!isLogin && verificationCode.length !== 6) {
      setMessage("请输入 6 位验证码");
      return;
    }

    try {
      const data = await apiJson<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(isLogin ? { email: email.trim(), password } : { email: email.trim(), password, verification_code: verificationCode }),
      });
      setToken(data.access_token);
      router.push("/");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "请求失败");
    }
  }

  async function sendVerificationCode() {
    setMessage("");
    setMessageTone("error");
    const emailError = validateEmail();
    if (emailError) {
      setMessage(emailError);
      return;
    }

    setSendingCode(true);
    try {
      const data = await apiJson<{ message: string; expires_in: number; code?: string }>("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setCodeCountdown(Math.min(60, data.expires_in));
      setMessageTone("info");
      setMessage(data.code ? `验证码已发送：${data.code}` : "验证码已发送，请查收邮箱");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_82%_18%,rgba(201,225,255,0.85),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#edf5ff_46%,#dcecff_100%)] text-[#08142d]">
      <div className="absolute -right-20 -top-24 h-[460px] w-[460px] rounded-full border border-white/80" />
      <div className="absolute bottom-[-120px] right-[520px] h-[240px] w-[240px] rounded-full bg-[#c6ddff]/30 blur-sm" />
      <div className="mx-auto grid min-h-screen max-w-[1380px] grid-cols-[1fr_590px] items-center gap-12 px-16 py-12">
        <section>
          <Link href="/" className="mb-28 flex items-center gap-3">
            <Logo dark />
            <span className="text-[28px] font-black">灵析</span>
          </Link>
          <h1 className="text-[52px] font-black leading-tight tracking-normal">
            灵析 · 让<span className="mx-1 text-[#176bff]">效率</span>触手可及
          </h1>
          <p className="mt-5 text-[18px] leading-8 text-[#74839c]">一站式实用工具平台，视频处理、文档转换、PDF 工具等全方位满足您的需求</p>
          <HeroVisual />
          <AdvantageStrip />
        </section>

        <section className="rounded-[24px] bg-white/70 px-14 py-14 shadow-[0_24px_80px_rgba(56,104,178,0.16)] ring-1 ring-white/72 backdrop-blur-xl">
          <h2 className="text-center text-[32px] font-black tracking-normal">欢迎回来</h2>
          <p className="mt-4 text-center text-[17px] font-medium text-[#667693]">{isLogin ? "登录灵析，继续高效工作" : "注册灵析，开启高效工作"}</p>
          <div className="mt-9 grid grid-cols-2 border-b border-[#d6e2f3] text-center text-[16px] font-black">
            <Link href="/login" className={`relative pb-4 ${isLogin ? "text-[#176bff]" : "text-[#667693]"}`}>登录{isLogin ? <span className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-[#176bff]" /> : null}</Link>
            <Link href="/register" className={`relative pb-4 ${!isLogin ? "text-[#176bff]" : "text-[#667693]"}`}>注册{!isLogin ? <span className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-[#176bff]" /> : null}</Link>
          </div>

          <div className="mt-8 space-y-5">
            <label className="auth-input">
              <Mail className="h-5 w-5 text-[#95a1b7]" />
              <input type="email" placeholder="请输入邮箱地址" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {!isLogin ? (
              <div className="auth-input pr-2">
                <ShieldCheck className="h-5 w-5 text-[#95a1b7]" />
                <input inputMode="numeric" maxLength={6} placeholder="请输入验证码" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
                <button type="button" onClick={() => void sendVerificationCode()} disabled={sendingCode || codeCountdown > 0 || !email} className="h-10 shrink-0 rounded-lg bg-[#176bff]/10 px-4 text-sm font-black text-[#176bff] transition hover:bg-[#176bff]/15 disabled:cursor-not-allowed disabled:bg-[#eef4ff] disabled:text-[#8ba3c8]">
                  {codeCountdown > 0 ? `${codeCountdown}s` : sendingCode ? "发送中" : "发送验证码"}
                </button>
              </div>
            ) : null}
            <label className="auth-input">
              <Lock className="h-5 w-5 text-[#95a1b7]" />
              <input type="password" placeholder="请输入密码" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Eye className="h-5 w-5 text-[#95a1b7]" />
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#667693]"><span className="flex h-4 w-4 items-center justify-center rounded bg-[#176bff] text-[10px] text-white">✓</span>记住我</label>
              <button onClick={() => setMessage("找回密码接口尚未接入")} className="font-bold text-[#176bff]">忘记密码?</button>
            </div>
            <button onClick={() => void submit()} className="h-[58px] w-full rounded-lg bg-[#176bff] text-base font-black text-white shadow-[0_14px_30px_rgba(23,107,255,0.26)]">{isLogin ? "登录" : "注册"}</button>
          </div>

          <div className="my-9 flex items-center gap-5 text-sm font-medium text-[#95a1b7]"><span className="h-px flex-1 bg-[#d6e2f3]" />或使用其他方式登录<span className="h-px flex-1 bg-[#d6e2f3]" /></div>
          <div className="flex justify-center gap-10">
            <Social label="G" color="text-[#4285f4]" />
            <Social icon={<Github className="h-7 w-7" />} />
            <Social label="Q" color="text-[#3388ff]" />
          </div>
          <p className="mt-9 text-center text-sm text-[#8a98b2]">登录即表示您同意 <a className="font-bold text-[#176bff]">灵析的服务条款</a> 和 <a className="font-bold text-[#176bff]">隐私政策</a></p>
          {message ? <p className={`mt-5 rounded-lg px-4 py-3 text-sm ${messageTone === "info" ? "bg-blue-50 text-[#176bff]" : "bg-red-50 text-red-600"}`}>{message}</p> : null}
        </section>
      </div>
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="relative mt-[72px] h-[330px] max-w-[650px]">
      <div className="absolute left-[-38px] top-[118px] h-[150px] w-[700px] rounded-[50%] border border-white/70" />
      <div className="absolute left-[48px] top-[134px] h-[104px] w-[545px] rounded-[50%] border border-dashed border-[#c5d9fb]" />
      <div className="absolute left-[118px] top-[168px] h-[112px] w-[430px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(50,128,255,0.3),rgba(120,188,255,0.1)_44%,transparent_72%)] blur-[2px]" />
      <div className="absolute left-[226px] top-[214px] h-[28px] w-[196px] rounded-[50%] bg-[#1f7dff]/28 blur-md" />

      <div className="absolute left-[232px] top-[96px] h-[168px] w-[190px]">
        <div className="absolute left-[34px] top-[92px] h-[104px] w-[146px] -skew-y-6 rounded-[28px] bg-gradient-to-br from-[#74c9ff]/50 via-[#2484ff]/42 to-[#0c56d9]/55 shadow-[0_28px_48px_rgba(30,116,255,0.24)] backdrop-blur-md" />
        <div className="absolute left-[3px] top-[4px] flex h-[164px] w-[178px] rotate-[-9deg] items-center justify-center rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(232,242,255,0.68)_58%,rgba(160,207,255,0.52))] shadow-[0_22px_54px_rgba(80,135,220,0.22),inset_0_2px_8px_rgba(255,255,255,0.9)] backdrop-blur-xl">
          <div className="absolute inset-[13px] rounded-[27px] bg-[linear-gradient(145deg,rgba(255,255,255,0.74),rgba(255,255,255,0.12))]" />
          <div className="relative flex h-[78px] w-[78px] rotate-[9deg] items-center justify-center rounded-[22px] bg-[linear-gradient(145deg,#2e7cff,#0c62e9)] shadow-[0_16px_34px_rgba(17,104,244,0.34)]">
            <Logo />
          </div>
        </div>
      </div>

      <OrbitTile className="left-[78px] top-[76px] rotate-[7deg]" tone="blue"><Play className="h-7 w-7 fill-current" /></OrbitTile>
      <OrbitTile className="left-[12px] bottom-[55px] rotate-[10deg]" tone="red"><span className="text-sm font-black leading-4">PDF</span></OrbitTile>
      <OrbitTile className="right-[70px] top-[64px] rotate-[10deg]" tone="green"><FileText className="h-8 w-8" /></OrbitTile>
      <OrbitTile className="right-[18px] bottom-[82px] rotate-[-8deg]" tone="blue"><Repeat2 className="h-7 w-7" /></OrbitTile>
    </div>
  );
}

function AdvantageStrip() {
  const items = [
    { title: "安全可靠", desc: "数据加密存储", icon: <ShieldCheck className="h-8 w-8" /> },
    { title: "高效快捷", desc: "处理快人一步", icon: <Zap className="h-8 w-8" /> },
    { title: "功能全面", desc: "满足多种需求", icon: <Logo dark size="sm" /> },
    { title: "随时随地", desc: "多端同步使用", icon: <Cloud className="h-8 w-8" /> },
  ];
  return <div className="mt-4 grid max-w-[620px] grid-cols-4 rounded-2xl border border-white/80 bg-white/55 px-8 py-5 shadow-[0_16px_44px_rgba(89,132,200,0.12)] backdrop-blur">{items.map((item) => <div key={item.title} className="text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center text-[#176bff]">{item.icon}</span><div className="mt-2 text-sm font-black">{item.title}</div><div className="mt-1 text-xs text-[#667693]">{item.desc}</div></div>)}</div>;
}

function Social({ label, icon, color = "text-[#111827]" }: { label?: string; icon?: ReactNode; color?: string }) {
  return <button onClick={() => window.alert(`${label ?? "第三方"} 登录接口尚未接入`)} className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f3] bg-white text-[28px] font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={color}>{icon ?? label}</span></button>;
}

function OrbitTile({ className, children, tone }: { className: string; children: ReactNode; tone: "blue" | "red" | "green" }) {
  const color = tone === "red" ? "text-[#ff5267]" : tone === "green" ? "text-[#20c99d]" : "text-[#2d78ff]";
  return (
    <span className={`absolute flex h-[70px] w-[70px] items-center justify-center rounded-2xl border border-white/75 bg-white/62 shadow-[0_14px_34px_rgba(86,137,218,0.18),inset_0_1px_6px_rgba(255,255,255,0.72)] backdrop-blur-xl ${color} ${className}`}>
      <span className="absolute inset-[10px] rounded-xl bg-white/26" />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-current/10">{children}</span>
    </span>
  );
}
