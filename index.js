import puppeteer from "puppeteer";
import dotenv from "dotenv";

import { visitLoginPage, visitMessagesPage, visitThreadPage } from "./pages.js";
import { saveThreadMessages, removeThread } from "./helpers.js";

dotenv.config();

async function main() {
  // config
  const baseUrl = process.env.BASE_URL;
  const skipBulletins = process.env.DEV_DEL_BULLETINS === "true";
  const email = process.env.DEV_EMAIL;
  const pass = process.env.DEV_PASS;

  if (!baseUrl) {
    throw new Error('Please provide the Scribophile url in the "BASE_URL" env variable.');
  }

  if (!email || !pass) {
    throw new Error('Please provider the login credentials in the "DEV_PASS" and "DEV_EMAIL" env variables.');
  }

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  const loginPage = await visitLoginPage(page, {
    url: `${baseUrl}/dashboard/login`,
  });

  await loginPage.login(process.env.DEV_EMAIL, process.env.DEV_PASS);

  const messagesPage = await visitMessagesPage(page, {
    url: `${baseUrl}/dashboard/messages`,
  });

  const threads = [];

  // collect all threads in the inbox
  do {
    const threadInformation = await messagesPage.collectThreadInformation();

    threads.push(...threadInformation);

    break;
  } while (await messagesPage.nextPage());

  // manually visit all threads, save messages in them and remove them
  for (const { threadId, isBulletin, userName } of threads) {
    if (!(isBulletin && skipBulletins)) {
      const threadPage = await visitThreadPage(page, {
        url: `${baseUrl}/dashboard/messages/${threadId}`,
        threadId,
      });

      const messages = await threadPage.collectThreadMessages();

      saveThreadMessages({ messages, userName });
    }

    await removeThread(page, { threadId, url: `${baseUrl}/dashboard/popups/delete-private-message-thread` });

    break;
  }

  await browser.close();
}

main();
