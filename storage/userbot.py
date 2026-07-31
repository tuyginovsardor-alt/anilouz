import asyncio
import os
from telethon import TelegramClient
from dotenv import load_dotenv
from database import get_setting

load_dotenv()

# We prefer database settings, fallback to env
def get_credentials():
    api_id = get_setting("TG_API_ID") or os.getenv("TG_API_ID")
    api_hash = get_setting("TG_API_HASH") or os.getenv("TG_API_HASH")
    return api_id, api_hash

SESSION_NAME = os.path.join(os.path.dirname(__file__), "anilo_user")

async def init_client():
    api_id, api_hash = get_credentials()
    if not api_id or not api_hash:
        return None
    try:
        client = TelegramClient(SESSION_NAME, int(api_id), api_hash)
        await client.connect()
        return client
    except Exception:
        return None

async def is_authenticated():
    client = await init_client()
    if not client: return False
    try:
        auth = await client.is_user_authorized()
        await client.disconnect()
        return auth
    except Exception:
        return False

async def download_large_video(file_id, destination):
    # This would be used if we store TG file_ids
    # For now it's a placeholder for the logic
    pass
