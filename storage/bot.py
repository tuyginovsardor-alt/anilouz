import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use service role for admin bypass
ADMINS = [int(id) for id in os.getenv("ADMIN_IDS", "").split(",") if id]

STORAGE_URL = "https://api.anilo.uz/films/"
STORAGE_PATH = "films/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id not in ADMINS:
        return await message.answer("Siz admin emassiz!")
    await message.answer("Xush kelibsiz Admin! Video faylni yuboring, men uni storagega va saytga qo'shaman.")

@dp.message()
async def handle_message(message: types.Message):
    if message.from_user.id not in ADMINS:
        return

    if message.video:
        msg = await message.answer("Video yuklanmoqda va Supabasega qo'shilmoqda...")
        file_id = message.video.file_id
        file = await bot.get_file(file_id)
        
        file_name = f"{file_id}.mp4"
        destination = os.path.join(STORAGE_PATH, file_name)
        
        await bot.download_file(file.file_path, destination)
        
        video_url = f"{STORAGE_URL}{file_name}"
        
        # Supabasega ma'lumot qo'shish
        try:
            movie_data = {
                "title": message.video.file_name or "Yangi Film",
                "poster_url": "https://via.placeholder.com/400x600?text=No+Poster",
                "video_url": video_url,
                "type": "anime", # Default type
                "year": "2026",
                "genre": "Action",
                "rating": 5.0,
                "view_count": 0
            }
            
            supabase.table("movies").insert(movie_data).execute()
            await msg.edit_text(f"Muvaffaqiyatli yuklandi va saytga qo'shildi!\nURL: {video_url}")
        except Exception as e:
            await msg.edit_text(f"Xatolik yuz berdi: {str(e)}")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
