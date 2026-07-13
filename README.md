# Telegram Pizza Delivery Mini App

Ushbu loyiha Telegram Mini App ichida ishlaydigan Pizza yetkazib berish tizimidir. Loyiha ikki qismdan iborat:
1. **Backend**: Express API va Telegram Bot (Node.js, Prisma ORM, PostgreSQL).
2. **Frontend**: Minimalist dizaynli React ilovasi (Vite, React, Tailwind yordamisiz toza CSS).

---

## 🛠️ O'rnatish va Sozlash

### 1. Ma'lumotlar bazasi va Muhit (Environment) sozlamalari
Loyiha ishlashi uchun sizga **PostgreSQL** ma'lumotlar bazasi va **Telegram Bot** kerak bo'ladi.

* **Telegram Bot yaratish**: [@BotFather](https://t.me/BotFather) orqali yangi bot yarating va uning Tokenini oling.
* **Telegram ID ni aniqlash**: [@userinfobot](https://t.me/userinfobot) orqali o'zingizning Telegram ID'ingizni oling (Bu administrator ID bo'ladi).

### 2. Backend sozlash (`backend` papkasida)
1. `/backend/.env` faylini oching va quyidagi qiymatlarni o'zgartiring:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
   BOT_TOKEN="sizning_bot_tokeningiz"
   ADMIN_ID="sizning_telegram_idyingiz"
   ```
2. Terminalda `/backend` papkasiga o'ting va quyidagi buyruqlarni ketma-ket ishga tushiring:
   * **Kutubxonalarni o'rnatish**: `npm install`
   * **Baza jadvallarini yaratish (Migration)**: `npm run db:push`
   * **Pitsalarni bazaga yozish (Seed)**: `npm run db:seed`
   * **Serverni ishga tushirish**: `npm start`

### 3. Frontend sozlash (`frontend` papkasida)
1. `/frontend/.env` faylida API manzili to'g'ri o'rnatilganini tekshiring (`VITE_API_URL="http://localhost:5000"`).
2. Terminalda `/frontend` papkasiga o'ting va quyidagi buyruqlarni ishga tushiring:
   * **Kutubxonalarni o'rnatish**: `npm install`
   * **Ilovani ishga tushirish**: `npm run dev`

---

## 🚀 Telegramda Mini Appni ishga tushirish

1. BotFather-ga kiring va botingiz sozlamalaridan Mini App tugmasini qo'shing:
   * `/newapp` buyrug'ini yuboring.
   * Botingizni tanlang.
   * Sarlavha va rasm yuklang.
   * Mini App URL manzili sifatida frontend manzilingizni kiriting (Mahalliy sinov uchun: `http://localhost:5173`).
   * Qisqa nom (short name) kiriting.
2. Yoki oddiygina botga `/start` buyrug'ini yuborsangiz, bot sizga Mini Appni ochish tugmasini yuboradi.

---

## 🍕 Loyiha Tuzilishi

* `backend/prisma/schema.prisma` - Ma'lumotlar bazasi sxemasi.
* `backend/server.js` - API server va Telegram bot boshqaruvi.
* `frontend/src/App.jsx` - Mini App interfeysi (Bosh sahifa, Savat, Buyurtmalar).
* `frontend/src/index.css` - Minimalist dizayn uslublari.
