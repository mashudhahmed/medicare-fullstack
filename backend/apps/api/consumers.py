import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            logger.warning("Unauthenticated WebSocket connection rejected.")
            await self.close(code=4001)
            return

        self.group_name = f"user_notifications_{self.user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"User {self.user.id} connected to WebSocket notifications.")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"User {getattr(self.user, 'id', None)} disconnected from WebSocket notifications.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get('action') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception as err:
            logger.debug(f"Invalid message format received: {err}")

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': event.get('id'),
            'title': event.get('title'),
            'message': event.get('message'),
            'category': event.get('category'),
            'created_at': event.get('created_at')
        }))


class VideoCallConsumer(AsyncWebsocketConsumer):
    """
    WebRTC Signaling Consumer for 1-on-1 and small room telemedicine consultations.
    Exchanges 'join', 'offer', 'answer', 'ice-candidate', and 'leave' messages.
    """
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"].get("room_id", "default")
        self.room_group_name = f"video_room_{self.room_id}"
        self.user = self.scope.get("user")

        user_id = str(self.user.id) if self.user and self.user.is_authenticated else "guest"
        user_name = self.user.get_full_name() if self.user and self.user.is_authenticated else "Participant"
        user_role = getattr(self.user, "role", "guest")

        self.user_info = {
            "user_id": user_id,
            "user_name": user_name,
            "role": user_role,
        }

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"User {user_name} ({user_id}) joined WebRTC signaling room: {self.room_id}")

        # Notify other participants in the room that a peer joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "webrtc_signal",
                "payload": {
                    "action": "peer_joined",
                    "sender_channel": self.channel_name,
                    "user_info": self.user_info,
                }
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            # Notify peers that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "webrtc_signal",
                    "payload": {
                        "action": "peer_left",
                        "sender_channel": self.channel_name,
                        "user_info": getattr(self, "user_info", {}),
                    }
                }
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User left WebRTC signaling room: {self.room_id}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action") or data.get("type")

            if not action:
                return

            if action == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
                return

            # Relay WebRTC signaling message to peers in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "webrtc_signal",
                    "payload": {
                        "action": action,
                        "sender_channel": self.channel_name,
                        "data": data.get("data") or data.get("payload") or data,
                        "user_info": getattr(self, "user_info", {}),
                    }
                }
            )
        except Exception as err:
            logger.error(f"Error handling WebRTC signaling message: {err}")

    async def webrtc_signal(self, event):
        """Send relayed signaling event to WebSocket client if not the sender"""
        payload = event.get("payload", {})
        if payload.get("sender_channel") != self.channel_name:
            await self.send(text_data=json.dumps(payload))