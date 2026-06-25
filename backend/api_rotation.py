import os
import time
from dotenv import load_dotenv
load_dotenv()
 
 
class GeminiKeyRotator:
    def __init__(self, prefix: str = "ai_key", cooldown: float = 60.0):
        self.keys     = self._doc_keys(prefix)
        self.cooldown = cooldown
        self._index   = 0
        self._errors  = {}
        self._cooldowns = {}
 
        if not self.keys:
            raise ValueError(
                f"Không tìm thấy API key nào với prefix '{prefix}' trong .env!\n"
                f"Thêm: {prefix}=AIza... vào file .env"
            )
        print(f"[KeyRotator] Đã load {len(self.keys)} key ({prefix}, {prefix}_2, ...)")
 
    def _doc_keys(self, prefix: str) -> list[str]:
        keys = []
        k = os.getenv(prefix, "")
        if k: keys.append(k)
        i = 2
        while True:
            k = os.getenv(f"{prefix}_{i}", "")
            if not k: break
            keys.append(k)
            i += 1
        return keys
 
    def get_client(self):
        from google import genai
        self._skip_cooldown_keys()
        key = self.keys[self._index]
        return genai.Client(api_key=key), self._index
 
    def on_success(self, index: int):
        self._errors[index] = 0  # reset lỗi
        self._rotate()

    def on_rate_limit(self, index: int):
        self._errors[index] = self._errors.get(index, 0) + 1
        self._cooldowns[index] = time.time() + self.cooldown
        print(f"  [KeyRotator] Key {index+1} rate limit "
              f"(lỗi lần {self._errors[index]}), cooldown {self.cooldown}s")
        self._rotate()
 
    def on_error(self, index: int, error: Exception):
        self._errors[index] = self._errors.get(index, 0) + 1
        print(f"  [KeyRotator] Key {index+1} lỗi: {error}")
        self._rotate()

    def _rotate(self):
        self._index = (self._index + 1) % len(self.keys)
 
    def _skip_cooldown_keys(self):
        """Bỏ qua các key đang trong thời gian cooldown."""
        now = time.time()
        for _ in range(len(self.keys)):
            het_han = self._cooldowns.get(self._index, 0)
            if now >= het_han:
                return 
            self._rotate()
        min_wait = min(
            max(0, self._cooldowns.get(i, 0) - now)
            for i in range(len(self.keys))
        )
        if min_wait > 0:
            print(f"  [KeyRotator] Tất cả key đang cooldown, chờ {min_wait:.0f}s...")
            time.sleep(min_wait + 1)
 
    def status(self) -> dict:
        now = time.time()
        return {
            "tong_key"   : len(self.keys),
            "key_hien_tai": self._index + 1,
            "trang_thai" : [
                {
                    "key"       : i + 1,
                    "so_loi"    : self._errors.get(i, 0),
                    "cooldown_con": max(0, round(self._cooldowns.get(i, 0) - now)),
                }
                for i in range(len(self.keys))
            ]
        }

    def __call__(self, func):
        """
        Decorator tự động xử lý rate limit:
 
        @rotator
        def goi_gemini(client, prompt):
            ...
        """
        import functools
 
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            so_lan_thu = 0
            while so_lan_thu < len(self.keys):
                client, idx = self.get_client()
                try:
                    result = func(client, *args, **kwargs)
                    self.on_success(idx)
                    return result
                except Exception as e:
                    err = str(e).lower()
                    if "429" in err or "quota" in err or "rate" in err:
                        self.on_rate_limit(idx)
                    else:
                        self.on_error(idx, e)
                    so_lan_thu += 1
            raise RuntimeError("Tất cả key đều thất bại")
        return wrapper