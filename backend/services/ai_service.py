import os
import httpx

OLLAMA_URL   = os.getenv("OLLAMA_URL",   "http://localhost:11434/api/chat")
OLLAMA_URL_G = os.getenv("OLLAMA_URL_G", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "giasuai")


def hoi_gia_su(noi_dung: str, lich_su: list[dict] = []) -> str:
    """
    Gọi Ollama với lịch sử hội thoại — dùng cho chat gia sư.
    lich_su: [{"role": "user"/"assistant", "content": "..."}]
    """
    messages = [
        {"role": "system", "content": "Chỉ trả lời bằng tiếng Việt."}
    ] + lich_su + [
        {"role": "user", "content": noi_dung}
    ]

    try:
        response = httpx.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            timeout=120,
        )
        response.raise_for_status()
        return response.json()["message"]["content"]

    except httpx.TimeoutException:
        return "⚠️ Ollama phản hồi quá chậm. Em thử lại nhé!"
    except httpx.ConnectError:
        return "⚠️ Không kết nối được Ollama. Kiểm tra xem Ollama đang chạy chưa."
    except Exception as e:
        return f"⚠️ Lỗi AI: {str(e)}"


def tao_de_thi_json(prompt: str) -> str:
    """
    Gọi Ollama với format=json — dùng cho tạo đề thi.
    Trả về string JSON thô, service exam sẽ parse.
    """
    try:
        response = httpx.post(
            OLLAMA_URL_G,
            json={
                "model":  OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=180,
        )
        response.raise_for_status()
        return response.json().get("response", "")

    except httpx.TimeoutException:
        raise RuntimeError("Ollama phản hồi quá chậm, thử lại")
    except httpx.ConnectError:
        raise RuntimeError("Không kết nối được Ollama. Chạy: ollama serve")
    except Exception as e:
        raise RuntimeError(f"Lỗi Ollama: {str(e)}")
