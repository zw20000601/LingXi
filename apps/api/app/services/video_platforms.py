from urllib.parse import urlparse


def detect_platform(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if "douyin.com" in host:
        return "douyin"
    if "bilibili.com" in host or "b23.tv" in host:
        return "bilibili"
    if "xiaohongshu.com" in host or "xhslink.com" in host:
        return "xiaohongshu"
    return "unknown"
