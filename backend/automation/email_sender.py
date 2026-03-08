import json
import smtplib
import sys
from email.message import EmailMessage


def fail(message: str, code: int = 1):
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def main():
    raw = sys.stdin.read()
    if not raw:
        fail("Missing payload")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        fail("Invalid JSON payload")

    smtp_cfg = payload.get("smtp", {})
    to_email = str(payload.get("to", "")).strip()
    subject = str(payload.get("subject", "Message from AI Assistant")).strip()
    body = str(payload.get("body", "")).strip()

    host = str(smtp_cfg.get("host", "")).strip()
    port = int(smtp_cfg.get("port", 587))
    secure = bool(smtp_cfg.get("secure", False))
    username = str(smtp_cfg.get("user", "")).strip()
    password = str(smtp_cfg.get("pass", "")).strip()
    sender = str(smtp_cfg.get("from", username)).strip()

    if not host or not username or not password or not to_email:
        fail("SMTP credentials or recipient email missing")

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject or "Message from AI Assistant"
    msg.set_content(body or "Hello")

    try:
        if secure:
            with smtplib.SMTP_SSL(host, port, timeout=30) as server:
                server.login(username, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=30) as server:
                server.ehlo()
                try:
                    server.starttls()
                    server.ehlo()
                except Exception:
                    # Some SMTP providers do not require STARTTLS.
                    pass
                server.login(username, password)
                server.send_message(msg)
    except Exception as error:
        fail(f"Failed to send email: {error}")

    print(
        json.dumps(
            {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
                "to": to_email,
            }
        )
    )


if __name__ == "__main__":
    main()
