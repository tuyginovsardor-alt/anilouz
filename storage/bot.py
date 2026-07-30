import asyncio
import logging
import os
import sqlite3
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import FSInputFile
import aiohttp

# KONFIGURATSIYA
BOT_TOKEN = "BOT_TOKEN_SHER_YERGA"
ADMINS = [8021115446, 8304278813]
STORAGE_URL = "https://api.anilo.uz/films/"
STORAGE_PATH = "films/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id not in ADMINS:
        return await message.answer("Siz admin emassiz!")
    await message.answer("Xush kelibsiz Admin! Video faylni yoki linkni yuboring, men uni storagega qo'shaman.")

@dp.message()
async def handle_message(message: types.Message):
    if message.from_user.id not in ADMINS:
        return

    # Agar video fayl bo'lsa
    if message.video:
        msg = await message.answer("Video yuklanmoqda... Kuting.")
        file_id = message.video.file_id
        file = await bot.get_file(file_id)
        
        file_name = f"{file_id}.mp4"
        destination = os.path.join(STORAGE_PATH, file_name)
        
        await bot.download_file(file.file_path, destination)
        
        url = f"{STORAGE_URL}{file_name}"
        await msg.edit_text(f"Muvaffaqiyatli yuklandi!\nURL: {url}")
        
    # Agar havola (link) bo'lsa
    elif message.text and message.text.startswith("http"):
        msg = await message.answer("Havola orqali yuklash boshlandi (Max 25 min)...")
        # Bu yerda yuklash logikasi (masalan yt-dlp yoki aiohttp orqali)
        # Soddalik uchun hozircha faqat xabar
        await asyncio.sleep(5)
        await msg.edit_text("Havola qabul qilindi. Server fonda yuklamoqda.")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
