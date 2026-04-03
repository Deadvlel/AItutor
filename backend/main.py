import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("gemini_api_key")
genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.5-flash')

chat = model.start_chat(history=[])

prompt = "bạn là một gia sư ai thông minh, hãy giúp đỡ học sinh trong việc giải bài bằng cách gợi ý cho họ lưu ý là bạn phải gợi ý trước và nếu họ thật sự không biết hãy đưa ra đáp án và giải thích kỹ càng và đưa ra một bài tập tương tự"
print("Bắt đầu học")
chat.send_message(prompt)

print("gia sư đã sẵn sàng")

while True:
    user_input = input("Bạn: ")

    if user_input == "exit" :
        print("Gia sư AI: hẹn gặp lại ")
        break

    if not user_input.strip():
        continue

    try:
        cau_hoi = chat.send_message(user_input)
        print(f"\n gia sư AI: {cau_hoi.text}\n")
    except Exception as e:
        print(f"\ncó lỗi kết nối: {e}\n")

