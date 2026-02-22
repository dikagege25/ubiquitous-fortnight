import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import cloudinary from "../lib/cloudinary.js";
import toPost from "../lib/toPost.js";
import prisma from "../lib/prisma.js";

dotenv.config();

const sesi = new Map();

const getPostByUserId = async (id) => {
  let user = await prisma.post.findFirst({
    where: { userId: String(id) },
  });

  if (!user) {
    user = await prisma.post.create({
      data: { userId: String(id) },
    });
  }

  return user;
};

const bot = new Telegraf(process.env.BOT_TOKEN);

/* ================= START ================= */

bot.start(async (ctx) => {
  await ctx.reply(
    `<i>Hello</i> <b>${ctx.from.first_name}</b>
<blockquote>Sekarang jika ingin posting di @jubel_ml</blockquote>\n<b>Silahkan kirim foto + caption</b>
dan wajib akhiri dengan HASTAG <blockquote><b>#REKBER_SETEMPAT</b></>
seperti contoh pada gambar di atas.`,
    {
      link_preview_options: {
        url: "https://t.me/jubel_ml/214035",
        prefer_large_media: true,
        show_above_text: true,
      },
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Menu utama", callback_data: "menu" }]],
      },
    },
  );
});

/* ================= PHOTO HANDLER ================= */

bot.on("photo", async (ctx) => {
  const caption = ctx.message.caption;

  if (!caption) {
    return ctx.reply("Harap upload foto + caption dalam 1 kali kirim.");
  }

  if (!caption.includes("#REKBER_SETEMPAT")) {
    return ctx.reply("Wajib ada HASTAG #REKBER_SETEMPAT\nSilakan coba lagi.");
  }

  const postData = await getPostByUserId(ctx.from.id);

  // 🔥 LOADING MESSAGE
  const loadingMsg = await ctx.reply("⏳ Sedang mengupload foto...");

  try {
    const photoArray = ctx.message.photo;
    const fileID = photoArray[photoArray.length - 1].file_id;

    const fileUrl = await bot.telegram.getFileLink(fileID);

    const result = await cloudinary.uploader.upload(fileUrl.href, {
      access_mode: "public",
    });

    // Update database
    await prisma.post.update({
      where: { id: postData.id },
      data: {
        userId: ctx.from.id.toString(),
        imageUrl: result.secure_url,
        caption: caption,
      },
    });

    // Edit loading jadi preview
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

    await ctx.replyWithPhoto(
      { url: result.secure_url },
      {
        caption: `<blockquote>Preview POSTINGAN :</blockquote>

${caption}

Apakah anda setuju?`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Lanjutkan",
                callback_data: `approve_${postData.id}`,
              },
            ],
            [
              {
                text: "Batal",
                callback_data: "menu",
              },
            ],
          ],
        },
      },
    );
  } catch (error) {
    console.log(error);
    await ctx.reply("Terjadi kesalahan saat upload. Coba lagi.");
  }
});

/* ================= APPROVE USER ================= */

bot.action(/approve_/, async (ctx) => {
  try {
    await ctx.editMessageCaption("Postinganmu sedang diproses oleh admin.");

    const postId = ctx.callbackQuery.data.replace("approve_", "");

    const user = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!user) return;

    await bot.telegram.sendPhoto(
      6328199559, // ID ADMIN
      { url: user.imageUrl },
      {
        caption: user.caption,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Approve POST",
                callback_data: `post_${user.userId}`,
              },
            ],
          ],
        },
      },
    );
  } catch (err) {
    console.log(err);
  }
});

/* ================= POST KE CHANNEL ================= */

bot.action(/post_/, async (ctx) => {
  try {
    const id = ctx.callbackQuery.data.replace("post_", "");

    const user = await getPostByUserId(id);

    const response = await toPost({
      image: { url: user.imageUrl },
      caption: user.caption.replace("#REKBER_SETEMPAT", ""),
    });

    if (response) {
      await bot.telegram.sendMessage(
        Number(id),
        "Postingan anda telah disetujui dan berhasil diposting ✅",
      );
    }
  } catch (error) {
    console.log(error);
  }
});

bot.catch((err) => console.log(err));

bot.launch();
