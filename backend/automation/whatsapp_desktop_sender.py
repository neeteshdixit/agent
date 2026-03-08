import json
import sys
import time


def fail(message: str, code: int = 1):
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def load_pyauto():
    try:
        import pyautogui  # type: ignore
        import pyperclip  # type: ignore
        return pyautogui, pyperclip
    except ImportError:
        fail("pyautogui and pyperclip are required. Install using: pip install pyautogui pyperclip")


def main():
    raw = sys.stdin.read()
    if not raw:
        fail("Missing payload")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        fail("Invalid JSON payload")

    contact = str(payload.get("contact", "")).strip()
    message = str(payload.get("message", "")).strip()
    startup_delay = float(payload.get("startupDelaySeconds", 4.0))
    step_delay = float(payload.get("stepDelaySeconds", 0.6))

    if not contact:
        fail("Contact name is required")
    if not message:
        fail("Message text is required")

    pyautogui, pyperclip = load_pyauto()
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.1

    # Allow WhatsApp Desktop to come to foreground.
    time.sleep(max(1.0, startup_delay))

    try:
        # Focus search box
        pyautogui.hotkey("ctrl", "f")
        time.sleep(step_delay)
        pyautogui.hotkey("ctrl", "a")
        pyautogui.press("backspace")

        # Search contact
        pyperclip.copy(contact)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(step_delay)
        pyautogui.press("enter")
        time.sleep(step_delay)

        # Type and send message
        pyperclip.copy(message)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(step_delay)
        pyautogui.press("enter")
    except Exception as error:
        fail(f"WhatsApp desktop automation failed: {error}")

    print(
        json.dumps(
            {
                "success": True,
                "message": f'WhatsApp message sent successfully to "{contact}"',
                "contact": contact,
            }
        )
    )


if __name__ == "__main__":
    main()
