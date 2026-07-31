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
    builder.row(types.InlineKeyboardButton(text="📝 Tahrirlash", callback_data="admin_edit_list"))
    builder.row(types.InlineKeyboardButton(text="📊 Statistika", callback_data="admin_stats"))
    builder.row(types.InlineKeyboardButton(text="⚙️ Sozlamalar", callback_data="admin_settings"))
    return builder.as_markup()

def get_settings_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="👥 Adminlar", callback_data="settings_admins"))
    builder.row(types.InlineKeyboardButton(text="🔙 Orqaga", callback_data="admin_main"))
    return builder.as_markup()

def get_admins_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="➕ Admin Qo'shish", callback_data="admin_add_new"))
    builder.row(types.InlineKeyboardButton(text="🔙 Orqaga", callback_data="admin_settings"))
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
    welcome_text = "👋 <b>Xush kelibsiz, Admin!</b>\n\nKerakli bo'limni tanlang:"
    await message.answer(welcome_text, reply_markup=get_main_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "admin_main")
async def main_menu(callback: types.CallbackQuery):
    admin_states[callback.from_user.id] = {}
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

@dp.callback_query(F.data == "admin_settings")
async def settings_menu(callback: types.CallbackQuery):
    await callback.message.edit_text("⚙️ <b>Sozlamalar bo'limi:</b>", reply_markup=get_settings_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "settings_admins")
async def manage_admins(callback: types.CallbackQuery):
    admins_list = "\n".join([f"• <code>{id}</code>" for id in ADMINS])
    text = f"👥 <b>Hozirgi Adminlar:</b>\n\n{admins_list}\n\nAdmin qo'shish uchun uning ID raqamini yuboring."
    admin_states[callback.from_user.id] = {"step": "add_admin"}
    await callback.message.edit_text(text, reply_markup=get_admins_keyboard(), parse_mode="HTML")

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
        return await message.answer("⚠️ Avval media turini tanlang! /start")

    file_size_mb = message.video.file_size / (1024 * 1024)
    if file_size_mb > 50: # Limit increased for local server usage but warned
        await message.answer("⚠️ Fayl katta. Yuklash biroz vaqt olishi mumkin.")

    msg = await message.answer("⏳ <b>Video serverga yuklanmoqda...</b>", parse_mode="HTML")
    try:
        file_id = message.video.file_id
        file = await bot.get_file(file_id)
        orig_name = message.video.file_name or f"video_{file_id}.mp4"
        file_name = f"{file_id}_{orig_name}"
        destination = os.path.join(STORAGE_PATH, file_name)
        await bot.download_file(file.file_path, destination)
        video_url = f"{STORAGE_URL}{file_name}"
        state.update({"video_url": video_url, "temp_title": orig_name.rsplit('.', 1)[0], "step": "title"})
        await msg.edit_text(f"✅ <b>Video yuklandi!</b>\n\n📝 Sarlavhani kiriting:\n(Hozirgi: <code>{state['temp_title']}</code>)\n\n<i>O'zgartirmaslik uchun '.' yuboring.</i>", parse_mode="HTML")
    except Exception as e:
        await msg.edit_text(f"❌ Yuklashda xatolik: {str(e)}")

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
    await callback.message.edit_text("🎭 <b>Janrlarni kiriting:</b>", parse_mode="HTML")

@dp.message(F.photo | F.document)
async def handle_poster_file(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state or state.get("step") != "poster": return
    msg = await message.answer("⏳ <b>Poster yuklanmoqda...</b>", parse_mode="HTML")
    try:
        file_id = message.photo[-1].file_id if message.photo else message.document.file_id
        ext = "jpg" if message.photo else "file"
        file = await bot.get_file(file_id)
        file_name = f"poster_{file_id}.{ext}"
        await bot.download_file(file.file_path, os.path.join(STORAGE_PATH, file_name))
        state["poster_url"] = f"{STORAGE_URL}{file_name}"
        await save_to_supabase(message, state)
    except Exception as e:
        await msg.edit_text(f"❌ Xatolik: {str(e)}")

@dp.message()
async def handle_text_inputs(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state: return
    step = state.get("step")
    
    if step == "add_admin":
        if message.text.isdigit():
            ADMINS.append(int(message.text))
            await message.answer(f"✅ Admin qo'shildi: {message.text}")
            del admin_states[message.from_user.id]
        return
    elif step == "title":
        state["title"] = state["temp_title"] if message.text == "." else message.text
        state["step"] = "year"
        await message.answer("📅 <b>Chiqish yili:</b>", parse_mode="HTML")
    elif step == "year":
        state["year"] = message.text
        state["step"] = "status"
        await message.answer("📌 <b>Media holati:</b>", reply_markup=get_status_keyboard())
    elif step == "genre":
        state["genre"] = message.text
        state["step"] = "translator"
        await message.answer("✍️ <b>Tarjimon:</b>", parse_mode="HTML")
    elif step == "translator":
        state["translator"] = message.text
        state["step"] = "tags"
        await message.answer("🏷 <b>Tags:</b>", parse_mode="HTML")
    elif step == "tags":
        state["tags"] = message.text
        state["step"] = "plot"
        await message.answer("📖 <b>Mazmuni:</b>", parse_mode="HTML")
    elif step == "plot":
        state["plot"] = message.text
        state["step"] = "poster"
        await message.answer("🖼 <b>Poster yuboring yoki URL:</b>", parse_mode="HTML")
    elif step == "poster":
        state["poster_url"] = message.text
        await save_to_supabase(message, state)

async def save_to_supabase(message: types.Message, state: dict):
    msg = await message.answer("🚀 Saqlanmoqda...")
    try:
        data = {
            "title": state["title"], "poster_url": state["poster_url"], "video_url": state["video_url"],
            "type": state["type"], "year": state["year"], "genre": state["genre"], "plot": state["plot"],
            "status": state["status"], "access_type": state["access_type"], "translator": state["translator"],
            "tags": state["tags"], "rating": 5.0, "view_count": 0, "is_series": False
        }
        supabase.table("movies").insert(data).execute()
        await msg.edit_text("✅ Muvaffaqiyatli qo'shildi!")
        if message.from_user.id in admin_states: del admin_states[message.from_user.id]
    except Exception as e:
        await msg.edit_text(f"❌ Xatolik: {str(e)}")

async def main(): await dp.start_polling(bot)
if __name__ == "__main__": asyncio.run(main())
