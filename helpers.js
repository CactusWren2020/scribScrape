import fs from "fs";

export function saveThreadMessages ({ messages, userName, fileName }) {
  const stream = fs.createWriteStream(fileName, { flags: "a" });

    stream.write(`--- Thread with ${userName} ---\n\n`);

  messages.forEach(({ userName, sentAt, message }) => {
    stream.write(userName + "\n");
    stream.write(sentAt + "\n");

    message.forEach((paragraph) => {
      stream.write(paragraph + "\n");
    });
  });

  stream.write("\n");
  stream.write("--- End ---\n");

  stream.end();
}

export function removeThread(/** @type {import('puppeteer').Page} */ page, { url, threadId }) {
  return page.evaluate(
    async ({ threadId, url }) => {
      const form = new FormData();

      form.append("privatemessagethreadid", threadId);
      form.append("referringfilter", 0);
      form.append("closeurl", window.location.origin);

      await fetch(url, {
        method: "POST",
        credentials: "include",
        referrerPolicy: "origin",
        body: form,
        mode: "cors",
      });

      return true;
    },
    { threadId, url }
  );
}

/**
 * uses fake user to send private messages to specified user
 * @param {array of objects} messages an array of objects representing messages
 */
export function sendFake(messages, user) {
    console.log(user, messages);
}