import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.services.runtime_config import get_smtp_config


async def send_verification_code_email(to_email: str, code: str) -> bool:
    config = await get_smtp_config()
    if not config["host"] or not config["user"] or not config["password"]:
        return False

    message = EmailMessage()
    message["Subject"] = "灵析注册验证码"
    message["From"] = formataddr((config["from_name"], config["user"]))
    message["To"] = to_email
    message.set_content(f"您的灵析注册验证码是：{code}\n\n验证码 10 分钟内有效。")

    port = int(config["port"] or "465")
    if config["secure"] == "tls":
        with smtplib.SMTP(config["host"], port, timeout=20) as server:
            server.starttls()
            server.login(config["user"], config["password"])
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(config["host"], port, timeout=20) as server:
            server.login(config["user"], config["password"])
            server.send_message(message)
    return True
