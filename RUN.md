# CropVerse (Final)

## 1) Setup MySQL

1. Create a database and tables by running:

   - Open MySQL Workbench (or CLI)
   - Run: `server/schema.sql`

2. If you already had an older DB and are getting errors like **Unknown column `profile_image`** or **Unknown column `message_type`**, run these upgrade queries (MySQL 5.7/8 compatible):

```sql
USE cropverse;

-- add missing user fields
ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL;
ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL;

-- chat tables (if missing)
CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  farmer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_thread (buyer_id, farmer_id),
  FOREIGN KEY (buyer_id) REFERENCES users(user_id),
  FOREIGN KEY (farmer_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NULL,
  message_type ENUM('text','image') NOT NULL DEFAULT 'text',
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(thread_id),
  FOREIGN KEY (sender_id) REFERENCES users(user_id),
  INDEX(thread_id),
  INDEX(created_at)
);

-- if chat_messages table already exists but columns are missing
ALTER TABLE chat_messages ADD COLUMN message_type ENUM('text','image') NOT NULL DEFAULT 'text';
ALTER TABLE chat_messages ADD COLUMN image_url VARCHAR(255) NULL;
```

> Note: MySQL does **not** support `ADD COLUMN IF NOT EXISTS` on many versions. If you get “Duplicate column”, just ignore that specific ALTER.

## 2) Run Backend (Server)

```bash
cd server
npm install
npm start
```

Server runs at: `http://localhost:4000`

If you see `EADDRINUSE: 4000`, stop the old server or kill the port:

```bash
lsof -i :4000
kill -9 <PID>
```

## 3) Run Frontend (Client)

This project uses static HTML. Open:

`client/index.html`

Recommended: use VS Code Live Server extension (or any static server).

## Features Included

- ✅ Quick Chat (polling modal)
- 🙂 Emoji picker
- 📸 Image send 
- Buyer **My Chats** thread list
- Farmer **My Chats** thread list
- Marketplace farmer contact info (phone/email) + chat
- Profile edit (buyer/farmer): name, email, phone, district, photo
- Admin panel: buyer/farmer remove
- Dark-mode chat visibility + left/right bubbles
