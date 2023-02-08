import fs from "fs";
import { LoremIpsum } from "lorem-ipsum";
import randomDate from "random-datetime";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import express from "express";

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

/**numMessages: {number} The number of fake messages you want 
 * returns an array of objects, each a message
*/
export function fakeMessages (numMessages){
    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 2
        },
        wordsPerSentence: {
            max: 16,
            min: 4
        }
    });

    const msgArray = [];
    let numMsg = numMessages;

    while (numMsg > 0) {
        let lowerFirst = lorem.generateWords(1);
        let firstName = lowerFirst.charAt(0).toUpperCase() + lowerFirst.slice(1);
        let lowerLast = lorem.generateWords(1);
        let lastName = lowerLast.charAt(0).toUpperCase() + lowerLast.slice(1);

        let date = new Date(randomDate());
        let dateFormat = date.getHours() + ":" + date.getMinutes() + ", " + date.toDateString();
        
        const msg = {
            author: firstName + " " + lastName,
            body: lorem.generateParagraphs(4),
            time: dateFormat
        }
        numMsg = numMsg - 1;
        msgArray.push(msg);
    }
    return msgArray;
}

