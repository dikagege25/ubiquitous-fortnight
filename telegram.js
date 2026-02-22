import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import { NewMessage, NewMessageEvent } from "telegram/events/index.js";
import prisma from "./lib/prisma.js";
const API_ID = 39038735;
const API_HASH = "badc738bca8b9ceceeef24ea82fcb6e0";
const stringSession = new StringSession(
  "1BQANOTEuMTA4LjU2LjEyNQG7G3UlrwGaMfK+o+AxcpaKNPV8iMVcCFz8AAZp7k1f5HSpz/XRucPNDLptvNzBEmyE0zUwsq0Fr7zBvgWWK4Px2jaYlE7sAFwE/Ufkxi91Jg0OtUbDd5mnU1ubnvaFxDfibvw/szbOL+kDPxSLN8JV1FRt5T865S3rF7CDTHqruScNLxu+62p4xevVEtR0m9yYwTp0/N+Mfkus5SOxb3uW/9u3PemQR+cf3xQN5ehEtEnFjd/tx1dgtZb5m5llUHsEjMqSWKOpuIMQW/9/WmhGJdAv7KOgffDEqz+PfSzLliygIfEI4qyQDT2M61wyZI66CzxYnG/LXOR6yyHFaFfDbA==",
);
const bank = [
  { title: "BRI (BANK RAKYAT INDONESIA)", rekening: "579089653833061" },
  { title: "PERMATA BANK", rekening: "8898041126374511" },
  { title: "BNI (BANK NEGARA INDONESIA)", rekening: "9888308106374511" },
  { title: "BSI (BANK SYARIAH INDONESIA)", rekening: `0089503196755` },
];
const sesi = new Map();
async function a() {
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  await client.connect();

  client.addEventHandler(async (msg) => {
    if (msg.isGroup) {
      const sesi = await prisma.group.findFirst({
        where: { chatId: msg.chatId.toString() },
        cacheStrategy: { swr: 0, ttl: 0 },
      });
      if (sesi) {
        if (msg.message.text.includes("Nominal transaksi")) {
          setTimeout(async () => {
            await msg.message.reply({
              parseMode: "html",
              message: `<blockquote>Oke ,next step pembeli melakukan pembayaran</blockquote>\n${bank.map((dt, index) => `<blockquote>${index + 1} : ${dt.title} :</blockquote>\n<i>NO REK</i> -> <code>${dt.rekening}</code>`)}\n\nE-MONEY SEPERTI DANA / GOPAY / OVO / DLL Silahkan transfer ke BANK di atas / request QRIS ke admin.\n\nCek keaslian di https://t.me/jubel_ml`,
            });
          }, 10000);
        } else if (msg.message.text === "del") {
          await prisma.group.deleteMany();
          console.log("BERHASIL DI HAPUS");
          return;
        }
        return;
      }
      await prisma.group.create({ data: { chatId: String(msg.chatId) } });
      await client.forwardMessages(msg.chatId, {
        fromPeer: -1003088650853,
        messages: [212813],
      });
    }
    console.log(sesi);
  }, new NewMessage());
}
a();
