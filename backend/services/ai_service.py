import os
import httpx
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
load_dotenv() 

OLLAMA_URL   = os.getenv("OLLAMA_URL",   "http://localhost:11434/api/chat")
OLLAMA_URL_G = os.getenv("OLLAMA_URL_G", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "giasuai")
CHROMA_PATH  = os.getenv("CHROMA_PATH",  "./chroma_sgk")
TOP_K        = 3

_collection = None

def _get_collection():
    global _collection
    if _collection is not None:
        return _collection
    if not os.path.exists(CHROMA_PATH):
        return None
    try:
        emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="intfloat/multilingual-e5-small"
        )
        client      = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = client.get_collection(
            name               = "sgk_doan_van",
            embedding_function = emb_fn,
        )
        return _collection
    except Exception as e:
        print(f"[Chroma] Lỗi khởi tạo: {e}")
        _collection = None 
        return None


def tim_sgk(cau_hoi: str, ten_mon: str = None, top_k: int = TOP_K) -> list[dict]:
    col = _get_collection()
    if col is None:
        return []
    try:
        where   = {"ten_mon": ten_mon} if ten_mon else None
        results = col.query(
            query_texts = [cau_hoi],
            n_results   = top_k,
            where       = where,
        )
        doan_list = []
        for i in range(len(results["documents"][0])):
            meta = results["metadatas"][0][i]
            noi_dung_raw = results["documents"][0][i]
            noi_dung_sach = _lam_sach_van_ban(noi_dung_raw)
            doan_list.append({
                "noi_dung"      : noi_dung_sach,
                "trang"         : meta.get("trang"),
                "dong_bat_dau"  : meta.get("dong_bat_dau"),
                "dong_ket_thuc" : meta.get("dong_ket_thuc"),
                "ten_mon"       : meta.get("ten_mon"),
                "score"         : 1 - results["distances"][0][i],
            })
        return doan_list
    except Exception as e:
        print(f"ChromaDB query lỗi: {e}")
        return []


def _lam_sach_van_ban(text: str) -> str:
    """Xóa ký tự lạ sinh ra từ OCR/encoding lỗi trong SGK."""
    if not text:
        return text
    import unicodedata, re
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def _xay_dung_ngu_canh(doan_list: list[dict]) -> str:
    if not doan_list:
        return "(Không tìm thấy nội dung SGK liên quan)"
    ngu_canh = ""
    for d in doan_list:
        ngu_canh += (
            f"\n[{d['ten_mon']} - Trang {d['trang']}, "
            f"dòng {d['dong_bat_dau']}-{d['dong_ket_thuc']}]\n"
            f"{d['noi_dung']}\n"
        )
    return ngu_canh


# ──────────────────────────────────────────────────────────────
# GEMINI — dùng cho phần HƯỚNG DẪN bài học (bước 1, 2, 3...)
# ──────────────────────────────────────────────────────────────
from google import genai

api_key = os.getenv("ai_key")
_gemini_client = genai.Client(api_key=api_key)

def hoi_gia_su(noi_dung: str, lich_su: list = [], ten_mon: str = None) -> str:
    """Gọi Gemini — dùng cho phần hướng dẫn bài học theo bước."""
    try:
        doan_list = tim_sgk(noi_dung, ten_mon=ten_mon)
        ngu_canh  = _xay_dung_ngu_canh(doan_list)

        system = (
            "Bạn là gia sư AI tên Thầy AI, dạy học sinh Việt Nam theo SGK.\n"
            "Gợi ý hướng suy nghĩ TRƯỚC, không đưa đáp án thẳng.\n"
            "Xưng Thầy, gọi Em, thân thiện. Chỉ dùng tiếng Việt.\n"
            "KHÔNG dùng ký tự đặc biệt, KHÔNG in đậm bằng markdown trừ **từ khóa** quan trọng."
        )

        full_prompt = f"{system}\n\nNỘI DUNG SGK:\n{ngu_canh}\n\nYÊU CẦU:\n{noi_dung}"

        response = _gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
        )
        return _lam_sach_van_ban(response.text)

    except Exception as e:
        return f"Lỗi AI: {str(e)}"


# ──────────────────────────────────────────────────────────────
# OLLAMA — dùng cho phần HỘI THOẠI chat với học sinh
# ──────────────────────────────────────────────────────────────
def hoi_gia_su_ollama(
    noi_dung: str,
    lich_su: list[dict] = [],
    ten_mon: str = None,
) -> str:
    """
    Gọi Ollama model local — dùng cho phần chat hội thoại.
    `lich_su` là list [{"role": "user"|"assistant", "content": "..."}]
    """
    doan_list = tim_sgk(noi_dung, ten_mon=ten_mon)
    ngu_canh  = _xay_dung_ngu_canh(doan_list)

    system_content = (
        "Bạn là gia sư AI tên Thầy AI, dạy học sinh Việt Nam theo SGK.\n"
        "NGUYÊN TẮC:\n"
        "1. Gợi ý hướng suy nghĩ TRƯỚC, không đưa đáp án thẳng\n"
        "2. Trả lời ngắn gọn, tối đa 5 dòng\n"
        "3. Xưng Thầy, gọi Em, thân thiện, khuyến khích\n"
        "4. Chỉ dùng tiếng Việt\n"
        "5. Từ khóa quan trọng bọc bằng **dấu sao** VD: **định lý Pythagoras**\n"
    )
    if doan_list:
        system_content += f"\nNỘI DUNG SGK LIÊN QUAN:\n{ngu_canh}"

    messages = [{"role": "system", "content": system_content}]
    for msg in lich_su:
        messages.append({
            "role"   : msg.get("role", "user"),
            "content": msg.get("content", ""),
        })
    messages.append({"role": "user", "content": noi_dung})

    print(f"[Ollama] Gọi model={OLLAMA_MODEL}, lịch_sử={len(lich_su)} tin, môn={ten_mon}")

    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model"   : OLLAMA_MODEL,
                "messages": messages,
                "stream"  : False,
            },
            timeout=120,
        )
        response.raise_for_status()
        result = response.json()
        model_used = result.get("model", "?")
        print(f"[Ollama] Phản hồi từ model={model_used}")
        content = result["message"]["content"]
        return _lam_sach_van_ban(content)

    except httpx.TimeoutException:
        return "Ollama phản hồi quá chậm. Em thử lại nhé!"
    except httpx.ConnectError:
        return "Không kết nối được Ollama. Kiểm tra xem Ollama đang chạy chưa."
    except Exception as e:
        return f"Lỗi Ollama: {str(e)}"


def kiem_tra_ollama() -> dict:
    try:
        res = httpx.post(
            OLLAMA_URL_G,
            json={
                "model" : OLLAMA_MODEL,
                "prompt": "Chào",
                "stream": False,
            },
            timeout=15,
        )
        res.raise_for_status()
        data = res.json()
        return {
            "online"    : True,
            "model"     : data.get("model", OLLAMA_MODEL),
            "phan_hoi"  : data.get("response", "")[:100],
        }
    except httpx.ConnectError:
        return {"online": False, "loi": "Ollama chưa chạy (ollama serve)"}
    except httpx.TimeoutException:
        return {"online": False, "loi": "Timeout — model chưa load xong"}
    except Exception as e:
        return {"online": False, "loi": str(e)}


def tao_de_thi_json(prompt: str) -> str:
    try:
        response = httpx.post(
            OLLAMA_URL_G,
            json={
                "model" : OLLAMA_MODEL,
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


def tim_vi_tri_tu_khoa(tu_khoa: str, ten_mon: str = None) -> dict | None:
    doan_list = tim_sgk(tu_khoa, ten_mon=ten_mon, top_k=1)
    if not doan_list:
        return None
    d = doan_list[0]
    return {
        "trang"         : d["trang"],
        "dong_bat_dau"  : d["dong_bat_dau"],
        "dong_ket_thuc" : d["dong_ket_thuc"],
        "doan_van"      : d["noi_dung"][:300],
        "ten_mon"       : d["ten_mon"],
    }
