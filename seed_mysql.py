import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='',
    database='nexusmind'
)
cursor = conn.cursor()

# Check if users table exists
cursor.execute("SHOW TABLES LIKE 'users'")
if not cursor.fetchone():
    print('ERROR: users table not found. Run Go backend once to AutoMigrate.')
    conn.close()
    exit()

# Check if admin exists
cursor.execute("SELECT id FROM users WHERE username = %s", ('admin',))
existing = cursor.fetchone()

password = 'admin123'
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

if existing:
    cursor.execute(
        "UPDATE users SET password_hash = %s, role = %s WHERE username = %s",
        (hashed, 'admin', 'admin')
    )
    print('Admin user updated.')
else:
    cursor.execute(
        "INSERT INTO users (created_at, updated_at, username, password_hash, nama, role, bio, profile_pic) "
        "VALUES (NOW(), NOW(), %s, %s, %s, %s, %s, %s)",
        ('admin', hashed, 'Administrator', 'admin', '', '')
    )
    print('Admin user created.')

conn.commit()

# Verify
cursor.execute("SELECT id, username, role FROM users")
users = cursor.fetchall()
print('Users in database:', users)

conn.close()
print('Done! Login: admin / admin123')
