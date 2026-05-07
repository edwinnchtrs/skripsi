import sqlite3
import bcrypt
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "nexusmind.db")

def seed_admin():
    password = "admin123"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if admin already exists
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    existing = cursor.fetchone()

    if existing:
        # Update password and role
        cursor.execute(
            "UPDATE users SET password_hash = ?, role = ? WHERE username = ?",
            (hashed, "admin", "admin")
        )
        print("Admin user updated.")
    else:
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO users (created_at, updated_at, username, password_hash, nama, role, bio, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (now, now, "admin", hashed, "Administrator", "admin", "", "")
        )
        print("Admin user created.")

    conn.commit()
    conn.close()
    print(f"Done! Login with username: admin / password: admin123")

if __name__ == "__main__":
    seed_admin()
