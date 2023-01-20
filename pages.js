export async function visitLoginPage(/** @type {import('puppeteer').Page} */ page, { url }) {
  await page.goto(url, { waitUntil: "networkidle0" });

  const selectors = Object.freeze({
    login: "input[name=email]",
    password: "input[name=password]",
  });

  return Object.freeze({
    selectors,
    login: async (login, password) => {
      await page.type(selectors.login, login);
      await page.type(selectors.password, password);

      await Promise.all([page.click("footer button"), page.waitForNavigation({ waitUntil: "networkidle0" })]);
    },
  });
}

export async function visitMessagesPage(/** @type {import('puppeteer').Page} */ page, { url }) {
  await page.goto(url, { waitUntil: "networkidle0" });

  const selectors = Object.freeze({
    threads: ".message-list > tbody > tr",
    userImage: ".user-image",
    threadLink: "[href*='/dashboard/messages']",
    nextPageButton: "a.next",
  });

  return Object.freeze({
    selectors,
    collectThreadInformation: async () => {
      const threadInformation = await page.evaluate((selectors) => {
        const threadElements = document.querySelectorAll(selectors.threads);

        return Array.from(threadElements).map((/** @type {Element} */ threadElement) => {
          const userImageElement = threadElement.querySelector(selectors.userImage);
          const linkElement = threadElement.querySelector(selectors.threadLink);

          return {
            userName: userImageElement.getAttribute("title"),
            threadId: /\/dashboard\/messages\/(\w+)/.exec(linkElement.getAttribute("href"))[1],
            isBulletin: linkElement.textContent.includes("Bulletin from"),
          };
        });
      }, selectors);

      return threadInformation;
    },
    nextPage: async () => {
      const canTransitionToNextPage = await page.$eval(
        selectors.nextPageButton,
        (nextPageButton) => !nextPageButton.classList.contains("disabled")
      );

      if (canTransitionToNextPage) {
        await Promise.all([
          page.click(selectors.nextPageButton),
          page.waitForNavigation({ waitUntil: "networkidle0" }),
        ]);
      }

      return canTransitionToNextPage;
    },
  });
}

export async function visitThreadPage(/** @type {import('puppeteer').Page} */ page, { url, threadId }) {
  await page.goto(url, { waitUntil: "networkidle0" });

  const selectors = Object.freeze({
    threadMessages: ".private-messages li",
    userName: ".user p a",
    messageBubble: ".bubble",
    time: ".bubble time",
  });

  return Object.freeze({
    selectors,
    collectThreadMessages: async () => {
      const threadMessages = await page.evaluate((selectors) => {
        const messageElements = document.querySelectorAll(selectors.threadMessages);

        return Array.from(messageElements).map((/** @type {Element} */ messageElement) => {
          const userNameElement = messageElement.querySelector(selectors.userName);
          const timeElement = messageElement.querySelector(selectors.time);
          const messageBubbleElement = messageElement.querySelector(selectors.messageBubble);
          const paragprahs = Array.from(messageBubbleElement.children).map((paragraph) => paragraph.textContent);

          paragprahs.pop(); // get rid of the timestamp

          return {
            userName: userNameElement.textContent,
            sentAt: timeElement.getAttribute("datetime"),
            message: paragprahs,
          };
        });
      }, selectors);

      return threadMessages;
    },
  });
}
