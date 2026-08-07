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
STORAGE_PATH = os.path.join(os.path.dirname(__file__), "films")
os.makedirs(STORAGE_PATH, exist_ok=True)

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
    builder.row(types.InlineKeyboardButton(text="👥 Bot Foydalanuvchilari", callback_data="admin_bot_users"))
    return builder.as_markup()

def get_settings_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="👥 Adminlar", callback_data="settings_admins"))
    builder.row(types.InlineKeyboardButton(text="🤖 UserBot (Telethon)", callback_data="settings_userbot"))
    builder.row(types.InlineKeyboardButton(text="🌐 CORS Sozlamalari", callback_data="settings_cors"))
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
    from database import log_user
    log_user(message.from_user.id, message.from_user.username, message.from_user.full_name)
    
    if message.from_user.id not in ADMINS:
        return await message.answer("⚠️ Kechirasiz, siz ushbu botning admini emassiz.\nLekin botga kirganingiz qayd etildi.")
    welcome_text = "👋 <b>Xush kelibsiz, Admin!</b>\n\nKerakli bo'limni tanlang:"
    await message.answer(welcome_text, reply_markup=get_main_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "admin_main")
async def main_menu(callback: types.CallbackQuery):
    admin_states[callback.from_user.id] = {}
    await callback.message.edit_text("Kerakli bo'limni tanlang:", reply_markup=get_main_keyboard())

@dp.callback_query(F.data == "admin_stats")
async def show_stats(callback: types.CallbackQuery):
    try:
        from database import get_bot_users_count
        
        movies_count = 0
        fandub_count = 0
        users_count = 0
        bot_users_count = get_bot_users_count()
        
        try:
            # Get movies count
            movies_res = supabase.table("movies").select("id", count="exact").execute()
            movies_count = movies_res.count if movies_res.count is not None else 0
        except Exception as e:
            logging.error(f"Movies count error: {e}")
            movies_count = "Xatolik"

        try:
            # Get fandub count
            fandub_res = supabase.table("fandub_projects").select("id", count="exact").execute()
            fandub_count = fandub_res.count if fandub_res.count is not None else 0
        except Exception:
            try:
                # Fallback to fandub_uploads if fandub_projects doesn't exist
                fandub_res = supabase.table("fandub_uploads").select("id", count="exact").execute()
                fandub_count = fandub_res.count if fandub_res.count is not None else 0
            except Exception as e:
                logging.error(f"Fandub count error: {e}")
                fandub_count = "Xatolik"
        
        try:
            # Get profiles count
            profiles_res = supabase.table("profiles").select("id", count="exact").execute()
            users_count = profiles_res.count if profiles_res.count is not None else 0
        except Exception as e:
            logging.error(f"Profiles count error: {e}")
            users_count = "Xatolik"

        stats_text = (
            "📊 <b>Asosiy Statistika</b>\n\n"
            f"🎬 Filmlar (Supabase): <b>{movies_count}</b>\n"
            f"🎙 Loyihalar: <b>{fandub_count}</b>\n"
            f"👥 Sayt foydalanuvchilari: <b>{users_count}</b>\n"
            f"🤖 Bot foydalanuvchilari: <b>{bot_users_count}</b>\n\n"
            "<i>Statistika Supabase va mahalliy bazadan olindi.</i>"
        )
        await callback.message.edit_text(stats_text, reply_markup=get_main_keyboard(), parse_mode="HTML")
    except Exception as e:
        logging.error(f"General Stats Error: {e}")
        await callback.answer(f"Xatolik: {str(e)}", show_alert=True)

@dp.callback_query(F.data == "admin_bot_users")
async def show_bot_users(callback: types.CallbackQuery):
    try:
        from database import get_bot_users
        users = get_bot_users(30) # Last 30 users
        
        if not users:
            return await callback.message.edit_text("📭 Bot foydalanuvchilari hali mavjud emas.", reply_markup=get_main_keyboard())
            
        text = "👥 <b>So'nggi 30 ta bot foydalanuvchilari:</b>\n\n"
        for user_id, username, full_name, first_seen in users:
            uname = f"@{username}" if username else "Noma'lum"
            text += f"🔹 {full_name} ({uname})\n   └ ID: <code>{user_id}</code> | {first_seen[:16]}\n\n"
            
        await callback.message.edit_text(text, reply_markup=get_main_keyboard(), parse_mode="HTML")
    except Exception as e:
        logging.error(f"Users list Error: {e}")
        await callback.answer("Foydalanuvchilar ro'yxatini yuklashda xatolik.", show_alert=True)

@dp.callback_query(F.data == "admin_settings")
async def settings_menu(callback: types.CallbackQuery):
    await callback.message.edit_text("⚙️ <b>Sozlamalar bo'limi:</b>", reply_markup=get_settings_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "settings_cors")
async def manage_cors(callback: types.CallbackQuery):
    text = (
        "🌐 <b>CORS Sozlamalari</b>\n\n"
        "Hozirda barcha domainlar uchun ruxsat berilgan (<code>*</code>).\n\n"
        "Agar maxsus domainlar (masalan: <code>anilo.uz</code>) qo'shmoqchi bo'lsangiz, "
        "bu funksiya Caddyfile ni yangilashni talab qiladi.\n\n"
        "Hozircha barcha domainlar ruxsat etilgan rejimda ishlamoqda."
    )
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="🔄 Caddy Restart", callback_data="cors_restart_caddy"))
    builder.row(types.InlineKeyboardButton(text="🔙 Orqaga", callback_data="admin_settings"))
    await callback.message.edit_text(text, reply_markup=builder.as_markup(), parse_mode="HTML")

@dp.callback_query(F.data == "cors_restart_caddy")
async def restart_caddy(callback: types.CallbackQuery):
    try:
        # This requires the user running the bot to have sudo permissions for caddy
        process = await asyncio.create_subprocess_shell(
            "sudo systemctl restart caddy",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            await callback.answer("✅ Caddy muvaffaqiyatli qayta ishga tushirildi!", show_alert=True)
        else:
            await callback.answer(f"❌ Xatolik: {stderr.decode()}", show_alert=True)
    except Exception as e:
        await callback.answer(f"❌ Xatolik: {str(e)}", show_alert=True)

@dp.callback_query(F.data == "settings_admins")
async def manage_admins(callback: types.CallbackQuery):
    admins_list = "\n".join([f"• <code>{id}</code>" for id in ADMINS])
    text = f"👥 <b>Hozirgi Adminlar:</b>\n\n{admins_list}\n\nAdmin qo'shish uchun uning ID raqamini yuboring."
    admin_states[callback.from_user.id] = {"step": "add_admin"}
    await callback.message.edit_text(text, reply_markup=get_admins_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data == "admin_add_new")
async def add_admin_callback(callback: types.CallbackQuery):
    admin_states[callback.from_user.id] = {"step": "add_admin"}
    await callback.message.edit_text("👥 <b>Yangi Admin ID</b> raqamini yuboring:", parse_mode="HTML")

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
        orig_name = message.video.file_name or f"video_{file_id}.mp4"
        file_name = f"{file_id}_{orig_name}"
        destination = os.path.join(STORAGE_PATH, file_name)
        if file_size_mb > 20:
            from userbot import init_client
            client = await init_client()
            success = False
            if client:
                try:
                    if await client.is_user_authorized():
                        await msg.edit_text("⚡️ <b>Katta fayl aniqlandi. UserBot orqali yuklanmoqda...</b>", parse_mode="HTML")
                        
                        async def progress_callback(received, total):
                            percent = (received / total) * 100
                            if int(percent) % 25 == 0:
                                try:
                                    await msg.edit_text(f"⚡️ <b>UserBot yuklamoqda: {percent:.1f}%</b>", parse_mode="HTML")
                                except Exception: pass

                        bot_info = await bot.get_me()
                        tg_msg = await client.get_messages(bot_info.username, ids=message.message_id)
                        
                        if not tg_msg or not tg_msg.media:
                            messages = await client.get_messages(bot_info.username, limit=5)
                            for m in messages:
                                if m.media:
                                    tg_msg = m
                                    break
                                    
                        if tg_msg and tg_msg.media:
                            await client.download_media(tg_msg, file=destination, progress_callback=progress_callback)
                            success = True
                        else:
                            logging.error(f"UserBot could not find message with media. Bot username: {bot_info.username}, Msg ID: {message.message_id}")
                    else:
                        logging.error("UserBot not authorized")
                except Exception as e:
                    logging.error(f"UserBot download error: {e}")
                finally:
                    await client.disconnect()
            
            if not success:
                # Fallback to Bot API if size permits
                if file_size_mb <= 20:
                    try:
                        file = await bot.get_file(file_id)
                        await bot.download_file(file.file_path, destination)
                        success = True
                    except Exception as e:
                        logging.error(f"Bot API download error: {e}")
                
                if not success:
                    await msg.edit_text("❌ UserBot orqali yuklab bo'lmadi. Iltimos, UserBot sozlamalarini tekshiring yoki faylni kichikroq qiling.")
                    return
        else:
            file = await bot.get_file(file_id)
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

@dp.callback_query(F.data == "settings_userbot")
async def userbot_menu(callback: types.CallbackQuery):
    from userbot import is_authenticated
    auth = await is_authenticated()
    status = "✅ Ulangan" if auth else "❌ Ulanmagan"
    
    text = (
        "🤖 <b>UserBot (Telethon) Sozlamalari</b>\n\n"
        f"Holati: {status}\n\n"
        "Ushbu bo'lim orqali Telegram API ID va Hash yordamida shaxsiy hisobingizni ulashingiz mumkin. "
        "Bu 2 GB gacha bo'lgan fayllarni yuklash imkonini beradi."
    )
    builder = InlineKeyboardBuilder()
    if not auth:
        builder.row(types.InlineKeyboardButton(text="🔗 Hisobni Ulash", callback_data="userbot_connect"))
    else:
        builder.row(types.InlineKeyboardButton(text="🔴 Uzish", callback_data="userbot_logout"))
    builder.row(types.InlineKeyboardButton(text="🔙 Orqaga", callback_data="admin_settings"))
    await callback.message.edit_text(text, reply_markup=builder.as_markup(), parse_mode="HTML")

@dp.callback_query(F.data == "userbot_logout")
async def logout_userbot(callback: types.CallbackQuery):
    from database import set_setting
    import os
    set_setting("TG_API_ID", "")
    set_setting("TG_API_HASH", "")
    session_file = os.path.join(os.path.dirname(__file__), "anilo_user.session")
    if os.path.exists(session_file):
        os.remove(session_file)
    await callback.answer("✅ UserBot ma'lumotlari o'chirildi.", show_alert=True)
    await userbot_menu(callback)

@dp.callback_query(F.data == "userbot_connect")
async def connect_userbot_start(callback: types.CallbackQuery):
    admin_states[callback.from_user.id] = {"step": "ub_api_id"}
    await callback.message.edit_text("📱 <b>Telegram API ID</b> ni kiriting:\n(my.telegram.org saytidan olinadi)", parse_mode="HTML")

@dp.message()
async def handle_text_inputs(message: types.Message):
    if message.from_user.id not in ADMINS: return
    state = admin_states.get(message.from_user.id)
    if not state: return
    step = state.get("step")
    
    if step == "add_admin":
        if message.text.isdigit():
            new_admin_id = int(message.text)
            if new_admin_id not in ADMINS:
                ADMINS.append(new_admin_id)
                await message.answer(f"✅ Admin qo'shildi: {new_admin_id}")
            else:
                await message.answer("⚠️ Ushbu ID allaqachon admin.")
            del admin_states[message.from_user.id]
        else:
            await message.answer("⚠️ Faqat raqamli ID yuboring.")
        return

    if step == "ub_api_id":
        state["api_id"] = message.text.strip()
        state["step"] = "ub_api_hash"
        await message.answer("🔑 Endi <b>API HASH</b> ni kiriting:", parse_mode="HTML")
    elif step == "ub_api_hash":
        state["api_hash"] = message.text.strip()
        state["step"] = "ub_phone"
        await message.answer("📞 Telegram <b>Telefon raqamingizni</b> kiriting:\n(Masalan: +998901234567)", parse_mode="HTML")
    elif step == "ub_phone":
        state["phone"] = message.text.strip()
        from userbot import SESSION_NAME
        from telethon import TelegramClient
        try:
            client = TelegramClient(SESSION_NAME, int(state["api_id"]), state["api_hash"])
            await client.connect()
            sent_code = await client.send_code_request(state["phone"])
            state["phone_code_hash"] = sent_code.phone_code_hash
            state["client"] = client
            state["step"] = "ub_code"
            await message.answer("📩 Telegramdan kelgan <b>KOD</b> ni kiriting:\n(Format: <code>1.2.3.4.5</code> yoki <code>12345</code>)", parse_mode="HTML")
        except Exception as e:
            await message.answer(f"❌ Xatolik: {str(e)}")
            del admin_states[message.from_user.id]
    elif step == "ub_code":
        # Robust code cleaning (removes spaces, dots, dashes)
        code = "".join(filter(str.isdigit, message.text))
        client = state["client"]
        try:
            await client.sign_in(state["phone"], code, phone_code_hash=state["phone_code_hash"])
            await message.answer("✅ <b>Tabriklaymiz! UserBot muvaffaqiyatli ulandi.</b>", parse_mode="HTML")
            # Save to database for persistence
            from database import set_setting
            set_setting("TG_API_ID", state["api_id"])
            set_setting("TG_API_HASH", state["api_hash"])
            await client.disconnect()
            del admin_states[message.from_user.id]
        except Exception as e:
            if "2FA" in str(e) or "password" in str(e).lower():
                state["step"] = "ub_2fa"
                await message.answer("🔐 <b>Ikki bosqichli parolni (2FA)</b> kiriting:", parse_mode="HTML")
            else:
                await message.answer(f"❌ Xatolik: {str(e)}")
                await client.disconnect()
                del admin_states[message.from_user.id]
    elif step == "ub_2fa":
        password = message.text.strip()
        client = state["client"]
        try:
            await client.sign_in(password=password)
            await message.answer("✅ <b>Tabriklaymiz! UserBot (2FA bilan) muvaffaqiyatli ulandi.</b>", parse_mode="HTML")
            from database import set_setting
            set_setting("TG_API_ID", state["api_id"])
            set_setting("TG_API_HASH", state["api_hash"])
            await client.disconnect()
            del admin_states[message.from_user.id]
        except Exception as e:
            await message.answer(f"❌ Xatolik: {str(e)}")
            await client.disconnect()
            del admin_states[message.from_user.id]
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
