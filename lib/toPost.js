import { Telegraf } from "telegraf";

import dotenv from "dotenv";
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const toPost = async ({ image, caption }) => {
  try {
    const response = await bot.telegram.sendPhoto(-1003088650853, image, {
      caption: `<blockquote>New POSTING ALERT !!!</><i>Keterangan</i><blockquote expandable><b>${caption}</></>#REKBER_SETEMPAT`,
      reply_to_message_id: 188812,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Contact SELLER / BUYYER`,
              style: "primary",
              url: `https://t.me/dream_str?text=Minta kontak yang POST ${caption}`,
              icon_custom_emoji_id: "5402186569006210455",
            },
          ],
        ],
      },
      parse_mode: "HTML",
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export default toPost;
