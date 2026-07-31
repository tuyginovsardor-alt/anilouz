import asyncio
import os
from telethon import TelegramClient
from dotenv import load_dotenv

load_dotenv()

API_ID = os.getenv("TG_API_ID")
API_HASH = os.getenv("TG_API_HASH")
SESSION_NAME = "anilo_user"

async def init_client():
    if not API_ID or not API_HASH:
        return None
    client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
    await client.connect()
    return client

async def is_authenticated():
    client = await init_client()
    if not client: return False
    auth = await client.is_user_authorized()
    await client.disconnect()
    return auth

async def download_large_video(file_id, destination):
    # This would be used if we store TG file_ids
    # For now it's a placeholder for the logic
    pass
