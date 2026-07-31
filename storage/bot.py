import asyncio
import logging
import os
import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from supabase import create_client, Client
from dotenv import load_dotenv

# .env load
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
raw_url = os.getenv("SUPABASE_URL", "")
# Clean URL
SUPABASE_URL = raw_url.split("/rest/v1")[0].rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ADMINS = [int(id.strip()) for id in os.getenv("ADMIN_IDS", "").split(",") if id.strip()]
STORAGE_URL = os.getenv("STORAGE_URL")
STORAGE_PATH = "films/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Temporary state for admins
admin_states = {}

# --- Keyboards ---

def get_main_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="➕ Yangi Media", callback_data="admin_add"))
    builder.row(types.InlineKeyboardButton(text="📊 Statistika", callback_897="admin_stats"))
    builder.row(types.InlineKeyboardButton(text="⚙️ Sozlamalar", callback_data="admin_settings"))
    return builder.as_markup()

def get_type_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="🎬 ANIME", callback_data="type_anime"))
    builder.row(types.InlineKeyboardButton(text="🎥 KINO", callback_data="type_kino"))
    builder.row(types.InlineKeyboardButton(text="📺 KDRAMA", callback_data="type_kdrama"))
    builder.row(types.InlineKeyboardButton(text="🧸 MULTFILM", callback_data="type_multfilm"))
    builder.row(types.InlineKeyboardButton(text="🔙 Orqaga", callback_data="admin_main"))
    return builder.as_markup()

def get_status_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="✅ Tugallangan", callback_data="status_completed"))
    builder.row(types.InlineKeyboardButton(text="⏳ Davom etmoqda", callback_data="status_ongoing"))
    return builder.as_markup()

def get_access_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="🔓 BEPUL", callback_data="access_free"))
    builder.row(types.InlineKeyboardButton(text="💎 PREMIUM", callback_data="access_premium"))
    return builder.as_markup()

# --- Handlers ---

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id not in ADMINS:
        return await message.answer("⚠️ Kechirasiz, siz ushbu botning admini emassiz.")
    
    welcome_text = (
        "👋 <b>Xush kelibsiz, Admin!</b>\n\n"
        "Ushbu bot orqali saytdagi kontentni boshqarishingiz mumkin.\n"
        "Kerakli bo'limni tanlang:"
    )
    await message.answer(welcome_text, reply_markup=get_main_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "admin_main")
async def main_menu(callback: types.CallbackQuery):
    admin_states[callback.from_user.id] = {} # Clear state
    await callback.message.edit_text("Kerakli bo'limni tanlang:", reply_markup=get_main_keyboard())

@dp.callback_query(F.data == "admin_stats")
async def show_stats(callback: types.CallbackQuery):
    try:
        movies_count = supabase.table("movies").select("id", count="exact").execute().count
        fandub_count = supabase.table("fandub_projects").select("id", count="exact").execute().count
        users_count = supabase.table("profiles").select("id", count="exact").execute().count
        
        stats_text = (
            "📊 <b>Sayt Statistikasi</b>\n\n"
            f"🎬 Jami Filmlar: <b>{movies_count}</b>\n"
            f"🎭 Fandub Loyihalar: <b>{fandub_count}</b>\n"
            f"👥 Ro'yxatdan o'tganlar: <b>{users_count}</b>\n\n"
            f"🕒 Yangilangan vaqt: <i>{datetime.datetime.now().strftime('%H:%M:%S')}</i>"
        )
        await callback.message.edit_text(stats_text, reply_markup=get_main_keyboard(), parse_mode="HTML")
    except Exception as e:
        await callback.answer(f"Xatolik: {str(e)}", show_alert=True)

@dp.callback_query(F.data == "admin_add")
async def start_add_flow(callback: types.CallbackQuery):
    await callback.message.edit_text("Qaysi turdagi media qo'shmoqchisiz?", reply_markup=get_type_keyboard())

@dp.callback_query(F.data.startswith("type_"))
async def select_type(callback: types.CallbackQuery):
    selected_type = callback.data.split("_")[1]
    admin_states[callback.from_user.id] = {"type": selected_type, "step": "upload"}
    await callback.message.edit_text(f"📁 Tanlandi: <b>{selected_type.upper()}</b>\n\nEndi video faylni yuboring.", parse_mode="HTML")

@dp.message(F.video)
async def handle_video(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state or state.get("step") != "upload":
        # Check if they are just sending a random video without starting flow
        return await message.answer("⚠️ Avval media turini tanlang! /start")

    msg = await message.answer("⏳ <b>Video serverga yuklanmoqda...</b>", parse_mode="HTML")
    
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
        
        state.update({
            "video_url": video_url,
            "temp_title": orig_name.rsplit('.', 1)[0],
            "step": "title"
        })
        
        await msg.edit_text(
            f"✅ <b>Video yuklandi!</b>\n\n📝 Sarlavhani kiriting:\n(Hozirgi: <code>{state['temp_title']}</code>)\n\n<i>O'zgartirmaslik uchun '.' yuboring.</i>",
            parse_mode="HTML"
        )
        
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        await msg.edit_text(f"❌ <b>Yuklashda xatolik yuz berdi:</b>\n{str(e)}", parse_mode="HTML")

@dp.callback_query(F.data.startswith("status_"))
async def select_status(callback: types.CallbackQuery):
    state = admin_states.get(callback.from_user.id)
    if not state or state.get("step") != "status": return
    
    state["status"] = callback.data.split("_")[1]
    state["step"] = "access"
    await callback.message.edit_text("🔓 Kirish turini tanlang:", reply_markup=get_access_keyboard())

@dp.callback_query(F.data.startswith("access_"))
async def select_access(callback: types.CallbackQuery):
    state = admin_states.get(callback.from_user.id)
    if not state or state.get("step") != "access": return
    
    state["access_type"] = callback.data.split("_")[1]
    state["step"] = "genre"
    await callback.message.edit_text("🎭 <b>Janrlarni kiriting:</b>\n(Masalan: Jangari, Sarguzasht, Komediya)", parse_mode="HTML")

@dp.message(F.photo | F.document)
async def handle_poster_file(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state or state.get("step") != "poster": return

    # User uploaded a file instead of URL
    msg = await message.answer("⏳ <b>Poster yuklanmoqda...</b>", parse_mode="HTML")
    
    try:
        if message.photo:
            file_id = message.photo[-1].file_id
            ext = "jpg"
        else:
            file_id = message.document.file_id
            ext = message.document.file_name.split('.')[-1] if '.' in message.document.file_name else "file"
            
        file = await bot.get_file(file_id)
        file_name = f"poster_{file_id}.{ext}"
        destination = os.path.join(STORAGE_PATH, file_name)
        
        await bot.download_file(file.file_path, destination)
        
        state["poster_url"] = f"{STORAGE_URL}{file_name}"
        await save_to_supabase(message, state)
        
    except Exception as e:
        await msg.edit_text(f"❌ Poster yuklashda xatolik: {str(e)}")

@dp.message()
async def handle_text_inputs(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state: 
        if message.text and not message.text.startswith("/"):
             await message.answer("⚠️ Amal bajarish uchun menyudan foydalaning yoki /start bosing.")
        return

    step = state.get("step")
    
    if step == "title":
        state["title"] = state["temp_title"] if message.text == "." else message.text
        state["step"] = "year"
        await message.answer("📅 <b>Chiqish yili:</b>\n(Masalan: 2024)", parse_mode="HTML")

    elif step == "year":
        state["year"] = message.text
        state["step"] = "status"
        await message.answer("📌 <b>Media holati:</b>", reply_markup=get_status_keyboard())

    elif step == "genre":
        state["genre"] = message.text
        state["step"] = "translator"
        await message.answer("✍️ <b>Tarjimon / Studiya nomi:</b>", parse_mode="HTML")

    elif step == "translator":
        state["translator"] = message.text
        state["step"] = "tags"
        await message.answer("🏷 <b>Qidiruv so'zlari (Tags):</b>\n(Masalan: Ninja, Boruto, Vampir...)", parse_mode="HTML")

    elif step == "tags":
        state["tags"] = message.text
        state["step"] = "plot"
        await message.answer("📖 <b>Qisqacha mazmuni:</b>", parse_mode="HTML")

    elif step == "plot":
        state["plot"] = message.text
        state["step"] = "poster"
        await message.answer("🖼 <b>Poster URL manzilini yuboring yoki rasm fayli tashlang:</b>\n(Yoki '.' yuboring)", parse_mode="HTML")

    elif step == "poster":
        state["poster_url"] = "https://via.placeholder.com/400x600?text=No+Poster" if message.text == "." else message.text
        await save_to_supabase(message, state)

async def save_to_supabase(message: types.Message, state: dict):
    msg = await message.answer("🚀 <b>Ma'lumotlar saqlanmoqda...</b>", parse_mode="HTML")
    try:
        movie_data = {
            "title": state["title"],
            "poster_url": state["poster_url"],
            "video_url": state["video_url"],
            "type": state["type"],
            "year": state["year"],
            "genre": state["genre"],
            "plot": state["plot"],
            "status": state["status"],
            "access_type": state["access_type"],
            "translator": state["translator"],
            "tags": state["tags"],
            "rating": 5.0,
            "view_count": 0,
            "is_series": False
        }
        
        supabase.table("movies").insert(movie_data).execute()
        
        final_text = (
            "✅ <b>Muvaffaqiyatli qo'shildi!</b>\n\n"
            f"🎬 <b>Nomi:</b> {state['title']}\n"
            f"📅 <b>Yili:</b> {state['year']}\n"
            f"📂 <b>Turi:</b> {state['type'].upper()}\n"
            f"📌 <b>Holati:</b> {state['status']}\n"
            f"💎 <b>Access:</b> {state['access_type']}\n"
            f"🔗 <a href='{state['video_url']}'>Video URL</a>"
        )
        await msg.edit_text(final_text, parse_mode="HTML", disable_web_page_preview=True)
        # Clear state
        if message.from_user.id in admin_states:
            del admin_states[message.from_user.id]
        
    except Exception as e:
        await msg.edit_text(f"❌ <b>Supabase xatoligi:</b>\n{str(e)}", parse_mode="HTML")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
