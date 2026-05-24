import redis
import os

class RedisClient:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.client = redis.from_url(redis_url)
            # Immediately ping to catch connection error during initialization
            self.client.ping()
        except Exception:
            # Redis is not installed, fail silently to use graceful fallback without terminal spam
            self.client = None

    def get(self, key):
        if self.client:
            try:
                return self.client.get(key)
            except Exception:
                pass
        return None

    def set(self, key, value, ex=3600):
        if self.client:
            try:
                self.client.set(key, value, ex=ex)
            except Exception:
                pass
