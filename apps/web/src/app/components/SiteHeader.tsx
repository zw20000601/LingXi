"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getToken } from "@/lib/api";

export type ActiveKey = "home" | "features" | "video" | "document" | "pdf" | "help";

const navItems: { key: ActiveKey; label: string; href: string }[] = [
  { key: "home", label: "首页", href: "/" },
  { key: "features", label: "工具汇总", href: "/features" },
  { key: "video", label: "视频工具", href: "/video-tools" },
  { key: "document", label: "文档转换", href: "/document-convert" },
  { key: "pdf", label: "PDF工具", href: "/pdf-tools" },
  { key: "help", label: "帮助中心", href: "/help-center" },
];

export function SiteHeader({ active, blend = false }: { active: ActiveKey; blend?: boolean }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function syncAuthState() {
      setLoggedIn(Boolean(getToken()));
    }
    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  function logout() {
    window.localStorage.removeItem("lingxi_token");
    setLoggedIn(false);
  }

  return (
    <header className={`relative z-30 h-[76px] text-white ${blend ? "bg-transparent" : "bg-[#020817]/95 shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"}`}>
      <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Logo />
          <span className="text-[25px] font-black tracking-normal text-white transition group-hover:text-blue-100">灵析</span>
        </Link>

        <nav className="hidden h-full items-center gap-12 text-[15px] font-semibold text-white/78 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex h-full items-center transition ${active === item.key ? "text-[#2c83ff]" : "hover:text-white"}`}
            >
              {item.label}
              {active === item.key ? <span className="absolute bottom-3 left-0 h-[2px] w-full rounded-full bg-[#2c83ff] shadow-[0_0_18px_rgba(44,131,255,0.9)]" /> : null}
            </Link>
          ))}
        </nav>

        {loggedIn ? (
          <div className="flex items-center gap-3">
            <Link href="/document-convert" className="flex h-10 min-w-[86px] items-center justify-center rounded-lg border border-white/18 bg-white/[0.03] px-4 text-sm font-bold text-white transition hover:bg-white/[0.08]">
              已登录
            </Link>
            <button type="button" onClick={logout} className="flex h-10 w-[78px] items-center justify-center rounded-lg bg-[#176bff] text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,107,255,0.34)] transition hover:bg-[#2d7cff]">
              退出
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" className="flex h-10 w-[78px] items-center justify-center rounded-lg border border-white/18 bg-white/[0.03] text-sm font-bold text-white transition hover:bg-white/[0.08]">
              登录
            </Link>
            <Link href="/register" className="flex h-10 w-[78px] items-center justify-center rounded-lg bg-[#176bff] text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,107,255,0.34)] transition hover:bg-[#2d7cff]">
              注册
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Logo({ dark = false, size = "md" }: { dark?: boolean; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <span className={`relative block ${box}`}>
      <span className="absolute left-[15%] top-[8%] h-[72%] w-[72%] rotate-45 rounded-[9px] bg-gradient-to-br from-[#78b8ff] via-[#2677ff] to-[#063fb9] shadow-[0_10px_26px_rgba(38,119,255,0.28)]" />
      <span className={`absolute left-[34%] top-[28%] h-[38%] w-[38%] rotate-45 rounded-[4px] ${dark ? "bg-[#f8fbff]" : "bg-[#071331]"}`} />
      <span className="absolute left-[5%] top-[39%] h-[38%] w-[38%] rotate-45 rounded-[4px] bg-[#38c7ff]" />
    </span>
  );
}

export function SiteFooter({ dark = true }: { dark?: boolean }) {
  const bg = dark ? "bg-[#020817] text-white" : "border-t border-[#e4ebf5] bg-[#f8fbff] text-[#101a35]";
  const muted = dark ? "text-[#8d9bb6]" : "text-[#667693]";
  return (
    <footer className={bg}>
      <div className="mx-auto grid max-w-[1380px] grid-cols-[320px_1fr_360px] gap-12 px-8 py-9">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Logo dark={!dark} />
            <span className="text-[25px] font-black">灵析</span>
          </Link>
          <p className={`mt-5 text-sm leading-7 ${muted}`}>一站式实用工具集合平台，帮助你更快完成视频、文档与 PDF 处理。</p>
          <p className={`mt-5 text-xs ${muted}`}>© 2024 灵析 · 让效率触手可及</p>
        </div>
        <div className="grid grid-cols-3 gap-10">
          <FooterColumn title="产品" links={[["工具汇总", "/features"], ["视频工具", "/video-tools"], ["文档转换", "/document-convert"], ["PDF工具", "/pdf-tools"]]} muted={muted} />
          <FooterColumn title="支持" links={[["帮助中心", "/help-center"], ["使用教程", "/help-center"], ["常见问题", "/help-center"], ["更新日志", "/help-center"]]} muted={muted} />
          <FooterColumn title="关于我们" links={[["关于灵析", "/help-center"], ["联系我们", "/help-center"], ["用户协议", "/help-center"], ["隐私政策", "/help-center"]]} muted={muted} />
        </div>
        <div>
          <h3 className="text-base font-black">订阅更新</h3>
          <p className={`mt-5 text-sm leading-6 ${muted}`}>接收最新功能、维护通知和工具使用技巧。</p>
          <div className={`mt-5 flex h-11 rounded-lg border p-1 ${dark ? "border-white/10 bg-white/[0.03]" : "border-[#dbe5f2] bg-white"}`}>
            <input className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#7988a4]" placeholder="请输入您的邮箱地址" />
            <button className="w-[82px] rounded-md bg-[#176bff] text-sm font-bold text-white">订阅</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, muted }: { title: string; links: Array<[string, string]>; muted: string }) {
  return (
    <div>
      <h3 className="text-base font-black">{title}</h3>
      <ul className={`mt-5 space-y-3 text-sm ${muted}`}>
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition hover:text-[#2c83ff]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#f7fbff] text-[#101a35]">{children}</main>;
}
