import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from supabase import create_client, Client
from dotenv import load_dotenv

# .env faylini yuklash
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
raw_url = os.getenv("SUPABASE_URL", "")
# URLni tozalash: /rest/v1/ qismini olib tashlash
SUPABASE_URL = raw_url.split("/rest/v1")[0].rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ADMINS = [int(id.strip()) for id in os.getenv("ADMIN_IDS", "").split(",") if id.strip()]
# IP yoki DNS orqali keladigan STORAGE_URL
STORAGE_URL = os.getenv("STORAGE_URL")
STORAGE_PATH = "films/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Temporary state for admins
admin_states = {}

# Step definitions
# 1. Select Type (handled by buttons)
# 2. Upload Video
# 3. Enter Title
# 4. Enter Year
# 5. Enter Genre

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
    await message.answer("Xush kelibsiz Admin! Media turini tanlang:", reply_markup=get_type_keyboard())

@dp.callback_query(F.data.startswith("type_"))
async def select_type(callback: types.CallbackQuery):
    selected_type = callback.data.split("_")[1]
    admin_states[callback.from_user.id] = {"type": selected_type, "step": "upload"}
    await callback.message.edit_text(f"Tanlandi: {selected_type.upper()}. Endi video faylni yuboring.")
    await callback.answer()

@dp.message(F.video)
async def handle_video(message: types.Message):
    if message.from_user.id not in ADMINS:
        return

    state = admin_states.get(message.from_user.id)
    if not state or state.get("step") != "upload":
        return await message.answer("Avval turini tanlang! /start ni bosing.")

    msg = await message.answer("Video storagega yuklanmoqda... Kuting.")
    
    try:
        file_id = message.video.file_id
        file = await bot.get_file(file_id)
        
        orig_name = message.video.file_name or f"video_{file_id}.mp4"
        safe_name = "".join([c if c.isalnum() or c in "._-" else "_" for c in orig_name])
        file_name = f"{file_id}_{safe_name}"
        destination = os.path.join(STORAGE_PATH, file_name)
        
        os.makedirs(STORAGE_PATH, exist_ok=True)
        await bot.download_file(file.file_path, destination)
        
        video_url = f"{STORAGE_URL}{file_name}"
        
        # Save info and move to next step
        state["video_url"] = video_url
        state["temp_title"] = orig_name.rsplit('.', 1)[0]
        state["step"] = "title"
        
        await msg.edit_text(f"✅ Video yuklandi.\n\nSarlavhani kiriting (Hozirgi: {state['temp_title']}):\n(O'zgartirmaslik uchun '.' yuboring)")
        
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        await msg.edit_text(f"❌ Xatolik: {str(e)}")

@dp.message()
async def handle_text_inputs(message: types.Message):
    if message.from_user.id not in ADMINS:
        return

    state = admin_states.get(message.from_user.id)
    if not state:
        return

    step = state.get("step")
    
    if step == "title":
        if message.text != ".":
            state["title"] = message.text
        else:
            state["title"] = state["temp_title"]
        
        state["step"] = "year"
        await message.answer("Yilini kiriting (Masalan: 2026):")

    elif step == "year":
        state["year"] = message.text
        state["step"] = "genre"
        await message.answer("Janrlarni kiriting (Masalan: Jangari, Komediya):")

    elif step == "genre":
        state["genre"] = message.text
        state["step"] = "plot"
        await message.answer("Qisqacha mazmunini (Plot) kiriting:")

    elif step == "plot":
        state["plot"] = message.text
        state["step"] = "poster"
        await message.answer("Poster URL manzilini kiriting (Rasm havolasi):\n(Standart rasm uchun '.' yuboring)")

    elif step == "poster":
        if message.text != ".":
            state["poster_url"] = message.text
        else:
            state["poster_url"] = "https://via.placeholder.com/400x600?text=No+Poster"
        
        # Final Save to Supabase
        try:
            movie_data = {
                "title": state["title"],
                "poster_url": state["poster_url"],
                "video_url": state["video_url"],
                "type": state["type"],
                "year": state["year"],
                "genre": state["genre"],
                "plot": state["plot"],
                "rating": 5.0,
                "view_count": 0,
                "status": "completed",
                "access_type": "free"
            }
            
            supabase.table("movies").insert(movie_data).execute()
            await message.answer(f"🚀 Saytga muvaffaqiyatli qo'shildi!\n\n🎬 Nomi: {movie_data['title']}\n📅 Yili: {movie_data['year']}\n📂 Turi: {movie_data['type'].upper()}\n🔗 URL: {movie_data['video_url']}")
            
            # Reset state
            del admin_states[message.from_user.id]
            
        except Exception as e:
            await message.answer(f"❌ Supabasega yozishda xatolik: {str(e)}")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
