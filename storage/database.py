import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "settings.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            full_name TEXT,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def log_user(user_id, username, full_name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO bot_users (user_id, username, full_name) VALUES (?, ?, ?)", (user_id, username, full_name))
    conn.commit()
    conn.close()

def get_bot_users_count():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM bot_users")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_bot_users(limit=50):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, username, full_name, first_seen FROM bot_users ORDER BY first_seen DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def set_setting(key, value):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()

def get_setting(key, default=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0]
    
    # Fallback to .env if not in DB
    from dotenv import load_dotenv
    load_dotenv()
    env_val = os.getenv(key)
    if env_val:
        set_setting(key, env_val)
        return env_val
    return default

init_db()
