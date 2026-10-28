import json
import redis
import redis.asyncio as aioredis
from channels.generic.websocket import AsyncWebsocketConsumer

sync_redis = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)
async_redis = aioredis.from_url("redis://127.0.0.1:6379/0", decode_responses=True)

def is_user_online(user_id):
    return sync_redis.scard(f"user:{user_id}:connections") > 0


class PresenceAndNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.user_group_name = f"notifications_user_{self.user.id}"
        self.redis_key = f"user:{self.user.id}:connections"

        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await async_redis.sadd(self.redis_key, self.channel_name)
        await async_redis.expire(self.redis_key, 3600)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user and self.user.is_authenticated:
            await async_redis.srem(self.redis_key, self.channel_name)

            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("type") == "heartbeat":
                await async_redis.expire(self.redis_key, 3600)
                await self.send(text_data=json.dumps({"type": "pong"}))
        except json.JSONDecodeError:
            pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_message_notification",
            "data": event["data"]
        }))