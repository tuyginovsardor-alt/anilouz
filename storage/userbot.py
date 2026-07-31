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

async def download_file_by_msg(chat_id, message_id, destination):
    client = await init_client()
    if not client: return False
    try:
        # We need to make sure we are connected
        if not await client.is_user_authorized():
            return False
            
        # Get the message from the chat
        # chat_id can be 'me', or the bot's ID/username
        msg = await client.get_messages(chat_id, ids=message_id)
        if msg and msg.media:
            # Add a progress callback or just download
            await client.download_media(msg, file=destination)
            return True
        return False
    except Exception as e:
        print(f"UserBot download error: {e}")
        return False
    finally:
        await client.disconnect()
