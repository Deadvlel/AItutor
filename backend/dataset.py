import json, time, os, random
from tqdm import tqdm
from api_rotation import GeminiKeyRotator
 
OUTPUT     = "dataset_giasuai.jsonl"
SO_MAU     = 500
BATCH_SIZE = 10
 
rotator = GeminiKeyRotator()
 
 
CHU_DE = [
    ("Toán 12", "đạo hàm", "học sinh hỏi cách tính đạo hàm hàm số hợp"),
    ("Toán 12", "tích phân", "học sinh không hiểu tại sao tích phân cho diện tích"),
    ("Toán 12", "giới hạn dãy số", "học sinh hỏi công thức giới hạn"),
    ("Giải Tích 12", "hàm số mũ", "học sinh nhầm lẫn giữa hàm mũ và hàm lũy thừa"),
    ("Toán 10", "phương trình bậc 2", "học sinh quên công thức nghiệm"),
    ("Toán 11", "xác suất", "học sinh hỏi xác suất có điều kiện"),
    ("Toán 11", "dãy số", "học sinh không phân biệt được cấp số cộng và cấp số nhân"),
 
    ("Ngữ Văn 12", "Vợ nhặt", "học sinh hỏi ý nghĩa nhan đề truyện"),
    ("Ngữ Văn 12", "Chiếc thuyền ngoài xa", "học sinh không hiểu chi tiết tấm ảnh"),
    ("Ngữ Văn 12", "nghị luận xã hội", "học sinh không biết cách mở bài"),
    ("Ngữ Văn 12", "Rừng xà nu", "học sinh hỏi hình tượng cây xà nu"),
    ("Ngữ Văn 11", "Chữ người tử tù", "học sinh hỏi vẻ đẹp nhân vật Huấn Cao"),

    ("Vật lý 10", "định luật Newton", "học sinh nhầm lẫn lực và gia tốc"),
    ("Vật lý 12", "dao động điều hòa", "học sinh không hiểu pha dao động"),
    ("Vật lý 12", "sóng điện từ", "học sinh hỏi bước sóng và tần số"),

    ("Hóa học 10", "liên kết hóa học", "học sinh hỏi sự khác nhau ion và cộng hóa trị"),
    ("Hóa học 11", "hữu cơ", "học sinh nhầm lẫn ankan anken ankin"),
    ("Hóa học 12", "kim loại", "học sinh hỏi dãy hoạt động hóa học"),

    ("Sinh học 12", "di truyền", "học sinh không hiểu quy luật Mendel"),
    ("Sinh học 12", "tiến hóa", "học sinh hỏi thuyết Darwin"),
]
 
TINH_HUONG = [
    "học sinh hỏi lần đầu, chưa hiểu gì",
    "học sinh hiểu một phần nhưng còn nhầm lẫn",
    "học sinh làm sai bài tập và hỏi tại sao sai",
    "học sinh hỏi ví dụ thực tế của kiến thức",
    "học sinh so sánh 2 khái niệm dễ nhầm",
    "học sinh hỏi cách ghi nhớ nhanh",
    "học sinh lo lắng về thi cử",
    "học sinh hỏi bài tập nâng cao",
    "học sinh trả lời câu hỏi của thầy nhưng còn thiếu ý",
]
 
SYSTEM_PROMPT = """Bạn là Thầy AI — gia sư thông minh, thân thiện, dạy học sinh Việt Nam theo SGK.
Nguyên tắc:
- Xưng Thầy, gọi Em
- Gợi ý hướng suy nghĩ TRƯỚC, không đưa đáp án thẳng ngay
- Ngắn gọn, tối đa 5-7 câu mỗi lượt
- Khuyến khích học sinh khi trả lời đúng
- Dùng **dấu sao** cho từ khóa quan trọng
- Chỉ tiếng Việt"""
 
 
def sinh_batch(so_luong: int = 10) -> list[dict]:
    """Gọi Gemini sinh một batch conversation, tự đổi key khi bị rate limit."""
    chu_de_chon     = random.choices(CHU_DE, k=so_luong)
    tinh_huong_chon = random.choices(TINH_HUONG, k=so_luong)
 
    danh_sach_yeu_cau = "\n".join([
        f"{i+1}. Môn: {cd[0]}, chủ đề: {cd[1]}, tình huống: {th}"
        for i, (cd, th) in enumerate(zip(chu_de_chon, tinh_huong_chon))
    ])
 
    prompt = f"""Tạo {so_luong} đoạn hội thoại gia sư-học sinh bằng tiếng Việt.
Mỗi đoạn có 2-4 lượt trao đổi (user=học sinh, assistant=Thầy AI).
Thầy AI tuân thủ: {SYSTEM_PROMPT}
 
Danh sách tình huống cần tạo:
{danh_sach_yeu_cau}
 
Trả về JSON thuần, không markdown:
{{
  "conversations": [
    {{
      "id": 1,
      "mon": "tên môn",
      "messages": [
        {{"role": "system", "content": "Bạn là Thầy AI..."}},
        {{"role": "user", "content": "câu hỏi học sinh"}},
        {{"role": "assistant", "content": "thầy trả lời"}},
        {{"role": "user", "content": "học sinh hỏi tiếp hoặc trả lời thầy"}},
        {{"role": "assistant", "content": "thầy phản hồi"}}
      ]
    }}
  ]
}}
 
Lưu ý:
- Học sinh nói tự nhiên, ngắn, đôi khi viết tắt
- Thầy AI gợi ý trước, dùng câu hỏi dẫn dắt
- Đa dạng phong cách: có bài nhẹ nhàng, có bài thầy khen, có bài thầy chỉ ra lỗi sai"""
 
    so_lan_thu = 0
    while so_lan_thu < len(rotator.keys):
        client, key_idx = rotator.get_client()
        try:
            res  = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            text = res.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(text)
            rotator.on_success(key_idx)
            return data.get("conversations", [])
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "rate" in err_str:
                rotator.on_rate_limit(key_idx)
            else:
                rotator.on_error(key_idx, e)
            so_lan_thu += 1
 
    print("  [!] Tất cả key đều lỗi batch này, bỏ qua")
    return []
 
 
def chuyen_sang_ollama_format(conv: dict) -> dict:
    """Chuyển conversation sang format Ollama finetune (Modelfile dataset)."""
    return {
        "messages": conv.get("messages", [])
    }
 
 
def main():
 
    print(f" Sinh dataset gia sư AI — {SO_MAU} mẫu")
    print(f" Số key đang dùng: {len(rotator.keys)}")
    print(f" Output: {OUTPUT}\n")
 
    da_sinh  = 0
    loi_lien = 0
 
    with open(OUTPUT, "w", encoding="utf-8") as f:
        with tqdm(total=SO_MAU, unit="mẫu") as pbar:
            while da_sinh < SO_MAU:
                con_lai = SO_MAU - da_sinh
                batch   = min(BATCH_SIZE, con_lai)
 
                convs = sinh_batch(batch)
 
                if not convs:
                    loi_lien += 1
                    if loi_lien > len(rotator.keys) * 2:
                        print("\n❌ Quá nhiều lỗi liên tiếp, dừng lại.")
                        break
                    time.sleep(5)
                    continue
 
                loi_lien = 0
                for conv in convs:
                    row = chuyen_sang_ollama_format(conv)
                    if len(row.get("messages", [])) >= 3:
                        f.write(json.dumps(row, ensure_ascii=False) + "\n")
                        da_sinh += 1
                        pbar.update(1)
 
                # Delay ngắn hơn khi có nhiều key
                delay = max(0.5, 1.5 / len(rotator.keys))
                time.sleep(delay)
 
    print(f"\n Xong! Đã sinh {da_sinh} mẫu → {OUTPUT}")
    print(f"\n Finetune với Unsloth trên Colab (T4 GPU miễn phí):")
    print(f"   1. Upload {OUTPUT} lên Google Drive")
    print(f"   2. Dùng notebook Unsloth + Qwen2.5-3B + LoRA")
    print(f"   3. Export GGUF → kéo vào Ollama")
 
 
if __name__ == "__main__":
    main()