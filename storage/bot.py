import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ADMINS = [int(id.strip()) for id in os.getenv("ADMIN_IDS", "").split(",") if id.strip()]
STORAGE_URL = os.getenv("STORAGE_URL", "https://api.anilo.uz/films/")
STORAGE_PATH = "films/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Temporary state for admins
admin_states = {}

def get_type_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="ANIME", callback_data="type_anime"))
    builder.row(types.InlineKeyboardButton(text="KINO", callback_data="type_kino"))
    builder.row(types.InlineKeyboardButton(text="KDRAMA", callback_data="type_kdrama"))
    builder.row(types.InlineKeyboardButton(text="MULTFILM", callback_data="type_multfilm"))
    return builder.as_markup()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id not in ADMINS:
        return await message.answer("Siz admin emassiz!")
    await message.answer("Xush kelibsiz Admin! Avval yuklamoqchi bo'lgan media turingizni tanlang:", reply_markup=get_type_keyboard())

@dp.callback_query(F.data.startswith("type_"))
async def select_type(callback: types.CallbackQuery):
    selected_type = callback.data.split("_")[1]
    admin_states[callback.from_user.id] = {"type": selected_type}
    await callback.message.edit_text(f"Tanlandi: {selected_type.upper()}. Endi video faylni yuboring.")
    await callback.answer()

@dp.message(F.video)
async def handle_video(message: types.Message):
    if message.from_user.id not in ADMINS:
        return

    state = admin_states.get(message.from_user.id)
    if not state:
        return await message.answer("Avval turini tanlang! /start ni bosing.")

    msg = await message.answer("Video yuklanmoqda va Supabasega qo'shilmoqda... Kuting.")
    
    try:
        file_id = message.video.file_id
        file = await bot.get_file(file_id)
        
        # Clean filename
        orig_name = message.video.file_name or f"video_{file_id}.mp4"
        # Remove spaces and special chars for URL safety
        safe_name = "".join([c if c.isalnum() or c in "._-" else "_" for c in orig_name])
        file_name = f"{file_id}_{safe_name}"
        destination = os.path.join(STORAGE_PATH, file_name)
        
        # Ensure directory exists
        os.makedirs(STORAGE_PATH, exist_ok=True)
        
        await bot.download_file(file.file_path, destination)
        
        video_url = f"{STORAGE_URL}{file_name}"
        
        # Supabasega ma'lumot qo'shish
        movie_data = {
            "title": orig_name.rsplit('.', 1)[0],
            "poster_url": "https://via.placeholder.com/400x600?text=No+Poster",
            "video_url": video_url,
            "type": state["type"],
            "year": "2026",
            "genre": "Action",
            "rating": 5.0,
            "view_count": 0
        }
        
        supabase.table("movies").insert(movie_data).execute()
        await msg.edit_text(f"✅ Muvaffaqiyatli yuklandi va saytga qo'shildi!\n🎬 Nomi: {movie_data['title']}\n📂 Turi: {state['type'].upper()}\n🔗 URL: {video_url}")
        
    except Exception as e:
        logging.error(f"Upload error: {str(e)}")
        await msg.edit_text(f"❌ Xatolik yuz berdi: {str(e)}")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
