import { Telegraf } from "telegraf";
import { getBahanById } from "./crud/bahan.js";
import toPost from "./lib/toPost.js";
import { getUserByNumber } from "./crud/user.js";
import { getChatByNumber } from "./crud/chat.js";
import cloudinary from "./lib/cloudinary.js";
import prisma from "./lib/prisma.js";

const bot = new Telegraf(process.env.BOT_CEK);
bot.start(async (msg) => {
  if (msg.message.text.startsWith("/start post")) {
    const text = msg.message.text.replace("/start post", "");
    const response = await getBahanById(text);
    await toPost({
      image: { url: response.imageUrl },
      caption: response.caption,
    }).then(() => {
      msg.reply(`Data ${response.caption} berhasil di post`);
    });
  }
});
bot.on("text", async (msg) => {
  const number = msg.message.text.replace(/\D/g, "");
  const data = await getUserByNumber(number.toString());
  if (data) {
    console.log(data);
    const datas = await getChatByNumber(data.id);
    console.log(datas);
    msg.reply(
      `Data ${data.number} dtitemukan \n${datas.map((dt, index) => `${index + 1} : ${dt.body}\n`)}`,
    );
  } else {
    msg.reply(`DATA ${number} TIDAK DITEMUKAN`);
  }
});
bot.on("photo", async (msg) => {
  const photo = msg.message.photo;
  const fileId = photo.pop().file_id;
  const url = await bot.telegram.getFileLink(fileId);
  const result = await cloudinary.uploader.upload(url.href, {
    access_mode: "public",
  });
  const newData = await prisma.bahan.create({
    data: { caption: msg.message.caption, imageUrl: result.secure_url },
  });
  if (!newData) {
    msg.reply("Data gagal di upload ");
    return;
  }
  await bot.telegram.sendPhoto(
    "@postingan_dream",
    { url: newData.imageUrl },
    {
      caption: newData.caption,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `POST`,
              url: `https://t.me/dreamstr_cek_bot?start=post${newData.id}`,
            },
          ],
        ],
      },
    },
  );
});
bot.launch();
