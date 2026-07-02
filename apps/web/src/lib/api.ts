const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type FileAsset = {
  id: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes: number;
  created_at?: string;
  expires_at?: string;
};

export type Job = {
  id: string;
  type: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  input?: unknown;
  result?: unknown;
  error?: string | null;
  input_file?: FileAsset | null;
  output_file?: FileAsset | null;
  created_at?: string;
  expires_at?: string;
};

export type AuthResponse = {
  access_token: string;
  user: { id: string; email: string; membership_status: string; is_admin?: boolean };
};

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lingxi_token") ?? "";
}

export function setToken(token: string) {
  localStorage.setItem("lingxi_token", token);
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(formatApiError(error.detail));
  }
  return response.json() as Promise<T>;
}

function formatApiError(detail: unknown): string {
  if (typeof detail === "string") return translateApiMessage(detail);

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const record = item as { loc?: unknown[]; msg?: unknown };
        const field = Array.isArray(record.loc) ? String(record.loc.at(-1) ?? "") : "";
        const msg = typeof record.msg === "string" ? record.msg : "";
        return translateValidationMessage(field, msg);
      })
      .filter(Boolean);
    return messages.length ? messages.join("；") : "请求参数有误";
  }

  if (detail && typeof detail === "object") {
    const record = detail as { message?: unknown; error?: unknown };
    if (typeof record.message === "string") return translateApiMessage(record.message);
    if (typeof record.error === "string") return translateApiMessage(record.error);
    return "请求失败，请稍后重试";
  }

  return "请求失败";
}

function translateApiMessage(message: string): string {
  const map: Record<string, string> = {
    "Email is already registered": "该邮箱已注册，请直接登录",
    "Invalid email or password": "邮箱或密码错误，请先注册或检查密码",
    "Please send verification code first": "请先发送验证码",
    "Verification code has expired": "验证码已过期，请重新发送",
    "Invalid verification code": "验证码错误，请重新输入",
    "Only QQ email registration is supported for now": "目前仅支持 QQ 邮箱注册",
    "Only QQ email registration/login is supported for now": "目前仅支持 QQ 邮箱登录和注册",
    "Not authenticated": "请先登录后再使用该功能",
    "Unsupported video platform": "暂不支持该视频平台",
    "VIDEO_PARSE_PROVIDER is not configured for live parsing": "视频解析服务未配置真实接口",
    "RAPIDAPI_KEY is not configured": "视频解析 API Key 未配置",
    "File upload is required": "请先上传文件",
  };
  return map[message] ?? message;
}

function translateValidationMessage(field: string, message: string): string {
  if (field === "email") return "请输入正确的 QQ 邮箱";
  if (field === "password" && message.includes("at least 8")) return "密码至少需要 8 位";
  if (field === "password" && message.includes("at most 128")) return "密码不能超过 128 位";
  if (field === "verification_code") return "请输入正确的验证码";
  return translateApiMessage(message || "请求参数有误");
}

export async function downloadFile(path: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "下载失败" }));
    throw new Error(formatApiError(error.detail));
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const quotedFilename = disposition.match(/filename="?([^"]+)"?/)?.[1];
  const filename = encodedFilename ? decodeURIComponent(encodedFilename) : quotedFilename || "lingxi-download";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function detectPlatform(url: string) {
  const value = url.toLowerCase();
  if (value.includes("douyin.com")) return "douyin";
  if (value.includes("bilibili.com") || value.includes("b23.tv")) return "bilibili";
  if (value.includes("xiaohongshu.com") || value.includes("xhslink.com")) return "xiaohongshu";
  return "unknown";
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}
