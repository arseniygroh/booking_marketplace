import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation, Message

redis_client = redis.Redis(
    host="127.0.0.1",
    port=6379,
    db=0,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


def is_user_online(user_id):
    try:
        return redis_client.scard(f"user:{user_id}:connections") > 0
    except redis.RedisError:
        return False


class PresenceAndNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        self.user_group_name = f"notifications_user_{self.user.id}"
        self.redis_key = f"user:{self.user.id}:connections"

    
        await self.accept()
        await self.add_connection()

        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user and not self.user.is_anonymous:
            await self.remove_connection()
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("type") == "heartbeat":
                await self.refresh_connection()
                await self.send(text_data=json.dumps({"type": "pong"}))
        except json.JSONDecodeError:
            pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_message_notification",
            "data": event["data"]
        }))


    @database_sync_to_async
    def add_connection(self):
        redis_client.sadd(self.redis_key, self.channel_name)
        redis_client.expire(self.redis_key, 3600)

    @database_sync_to_async
    def remove_connection(self):
        redis_client.srem(self.redis_key, self.channel_name)

    @database_sync_to_async
    def refresh_connection(self):
        redis_client.expire(self.redis_key, 3600)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        participants = await self.get_conversation_participants()
        if not participants or self.user.id not in (participants["guest_id"], participants["host_id"]):
            await self.close()
            return

        self.recipient_id = (
            participants["host_id"] 
            if self.user.id == participants["guest_id"] 
            else participants["guest_id"]
        )
        self.property_title = participants["property_title"]

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action_type = data.get("type", "send_message")

        
        if action_type == "send_message":
            content = data.get("content", "").strip()
            if not content:
                return

            msg_data = await self.create_message(content)

            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": msg_data,
                }
            )

            await self.channel_layer.group_send(
                f"notifications_user_{self.recipient_id}",
                {
                    "type": "send_notification",
                    "data": {
                        "conversation_id": int(self.conversation_id),
                        "property_title": self.property_title,
                        "sender_id": self.user.id,
                        "sender_username": self.user.username,
                        "preview": content[:80],
                        "created_at": msg_data["created_at"],
                    }
                }
            )

        elif action_type == "mark_read":
            message_id = data.get("message_id")
            if message_id:
                updated = await self.mark_message_as_read(message_id)
                if updated:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "message_read",
                            "message_id": message_id,
                        }
                    )

    # Group Event Handlers 

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": event["message"]
        }))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({
            "type": "message_read",
            "message_id": event["message_id"]
        }))

    # Database Helper Methods

    @database_sync_to_async
    def get_conversation_participants(self):
        try:
            conv = Conversation.objects.select_related("property").get(id=self.conversation_id)
            return {
                "guest_id": conv.guest_id,
                "host_id": conv.host_id,
                "property_title": conv.property.title,
            }
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def create_message(self, content):
        msg = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=content
        )
        Conversation.objects.filter(id=self.conversation_id).update(updated_at=timezone.now())
        
        return {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "is_read": msg.is_read,
        }

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        updated_count = (
            Message.objects
            .filter(id=message_id, conversation_id=self.conversation_id, is_read=False)
            .exclude(sender=self.user)
            .update(is_read=True)
        )
        return updated_count > 0