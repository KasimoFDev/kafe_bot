import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import localtunnel from 'localtunnel';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  console.error("XATOLIK: BOT_TOKEN o'rnatilmagan! Iltimos, .env faylini tekshiring.");
  process.exit(1);
}
const bot = new Telegraf(botToken);

// Setup start command logika
const registerBotStart = (webAppUrl) => {
  bot.start((ctx) => {
    if (webAppUrl.startsWith('https://')) {
      ctx.reply(
        `Assalomu alaykum, ${ctx.from.first_name || 'Mijoz'}! 🍕\n\nPizza buyurtma berish uchun quyidagi tugmani bosing:`,
        Markup.keyboard([
          [Markup.button.webApp('Pitsa buyurtma qilish 🍕', webAppUrl)]
        ]).resize()
      );
    } else {
      ctx.reply(
        `Assalomu alaykum, ${ctx.from.first_name || 'Mijoz'}! 🍕\n\n` +
        `Sizning Mini App manzilingiz local (HTTP). Telegram faqat HTTPS havolalarni Mini App sifatida ochishga ruxsat beradi.\n\n` +
        `Lokal sinash uchun quyidagi havolani brauzerda ochishingiz mumkin:\n${webAppUrl}\n\n` +
        `Mini App sifatida ishlatish uchun loyihani tunnel orqali HTTPS qilish tavsiya etiladi.`
      );
    }
  });

  bot.launch().then(() => {
    console.log(`Telegram Bot ishga tushdi. WebApp URL: ${webAppUrl}`);
  }).catch((err) => {
    console.error('Bot ishga tushishda xatolik:', err);
  });
};

// Automate Tunneling & Configuration
const initApp = async () => {
  let webAppUrl = process.env.WEBAPP_URL || '';
  let backendUrl = '';

  // 1. Expose backend server (port 5000) ALWAYS
  try {
    console.log("Mahalliy API serverni localtunnel yordamida tashqi internetga ulash (HTTPS)...");
    const backendTunnel = await localtunnel({ port: 5000 });
    backendUrl = backendTunnel.url;
    console.log(`Backend HTTPS tunnel URL: ${backendUrl}`);
    
    // Update frontend/.env with backend tunnel URL
    try {
      fs.writeFileSync('../frontend/.env', `VITE_API_URL="${backendUrl}"\n`);
      console.log(`Frontend .env yangilandi (VITE_API_URL=${backendUrl})`);
    } catch (fsErr) {
      console.error('Frontend .env yozishda xatolik:', fsErr);
    }

    backendTunnel.on('close', () => console.log('Backend tunnel yopildi.'));
  } catch (err) {
    console.error('Backend localtunnel ishga tushirishda xatolik yuz berdi:', err);
  }

  // 2. Handle frontend/WebApp URL
  if (webAppUrl.startsWith('https://')) {
    console.log(`Boshlang'ich WebApp URL (Vercel) ishlatilmoqda: ${webAppUrl}`);
    registerBotStart(webAppUrl);
  } else {
    // If not set, expose local frontend server (port 5173) using localtunnel
    try {
      const frontendTunnel = await localtunnel({ port: 5173 });
      console.log(`Frontend HTTPS tunnel URL: ${frontendTunnel.url}`);
      webAppUrl = frontendTunnel.url;
      
      // Update backend/.env to store it
      try {
        const envContent = `DATABASE_URL="postgresql://postgres:WhalexAI2026!@localhost:5432/pizza_db?schema=public"\nBOT_TOKEN="${botToken}"\nADMIN_ID="${process.env.ADMIN_ID}"\nWEBAPP_URL="${webAppUrl}"\nPORT=5000\n`;
        fs.writeFileSync('.env', envContent);
      } catch (e) {}

      registerBotStart(webAppUrl);
      frontendTunnel.on('close', () => console.log('Frontend tunnel yopildi.'));
    } catch (err) {
      console.error('Frontend localtunnel ishga tushirishda xatolik yuz berdi:', err);
      registerBotStart(webAppUrl || 'http://localhost:5173');
    }
  }
};

// API: Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Pizzalarni olishda xatolik:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

// API: Get user orders
app.get('/api/orders/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: { userId: String(telegramId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Buyurtmalarni olishda xatolik:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

// API: Create new order
app.post('/api/orders', async (req, res) => {
  const { telegramId, name, phone, address, items, totalAmount } = req.body;

  if (!telegramId || !name || !phone || !address || !items || !totalAmount) {
    return res.status(400).json({ error: 'Barcha ma\'lumotlar to\'ldirilishi shart!' });
  }

  try {
    // 1. Create or update user
    await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: { name, phone },
      create: { telegramId: String(telegramId), name, phone }
    });

    // 2. Create order in DB
    const order = await prisma.order.create({
      data: {
        userId: String(telegramId),
        items: items, // JSON field
        totalAmount: parseFloat(totalAmount),
        address
      }
    });

    // 3. Send message to the user
    try {
      await bot.telegram.sendMessage(
        telegramId,
        'Buyurtmangiz muvaffaqiyatli qabul qilindi va bazamizga saqlandi! Kuryerimiz tez orada bog\'lanadi 🍕'
      );
    } catch (botErr) {
      console.warn(`Foydalanuvchiga xabar yuborib bo'lmadi (ID: ${telegramId}):`, botErr.message);
    }

    // 4. Send message to the admin
    const adminId = process.env.ADMIN_ID;
    if (adminId) {
      const itemsList = items
        .map((item) => `- ${item.name} (${item.quantity} ta) - ${(item.price * item.quantity).toLocaleString()} so'm`)
        .join('\n');

      const receipt = `🔔 YANGI BUYURTMA!\n\n` +
        `👤 Mijoz: ${name}\n` +
        `📞 Telefon: ${phone}\n` +
        `📍 Manzil: ${address}\n\n` +
        `🍕 Buyurtma tarkibi:\n${itemsList}\n\n` +
        `💵 Jami summa: ${totalAmount.toLocaleString()} so'm\n` +
        `📅 Sana: ${new Date(order.createdAt).toLocaleString('uz-UZ')}`;

      try {
        await bot.telegram.sendMessage(adminId, receipt);
      } catch (adminErr) {
        console.error(`Adminga xabar yuborishda xatolik (ID: ${adminId}):`, adminErr.message);
      }
    } else {
      console.warn('ADMIN_ID .env da o‘rnatilmagan, admin xabari yuborilmadi.');
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Buyurtma yaratishda xatolik:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

// Start Express Server & Tunnels
app.listen(port, async () => {
  console.log(`Backend server port ${port} da ishlamoqda...`);
  await initApp();
});

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  prisma.$disconnect();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  prisma.$disconnect();
});
