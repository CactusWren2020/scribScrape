const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config()

async function main () {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 720 });
    await page.goto(process.env.DEV_LOGIN, { waitUntil: 'networkidle0' });
    //login
    await page.type('input[name=email]', process.env.DEV_EMAIL);
    await page.type('input[name=password]', process.env.DEV_PASS);
    await Promise.all([
        page.click("footer button"),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    //go to messages
    await page.goto("https://www.scribophile.com/dashboard/messages/")

    //parameters
    const friends = process.env.DEV_FRIENDS.split(', ');

    //will delete and not save bulletins
    const deleteBulletins = process.env.DEV_DEL_BULLETINS;

    //this will delete the first message in the inbox
    
    //open first message
    await Promise.all([
        page.click(".message-list tr"),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    //get author name
    await page.waitForSelector(".user p a")
    let authorLink = await page.$(".user p a")
    let authorName = await authorLink.evaluate(el => el.innerText.trim());
    console.log("authorName in friends?", friends.includes(authorName));

    //get status as a bulletin
    await page.waitForSelector(".header-bar .circle-cross")
    let deleteButton = await page.$(".header-bar .circle-cross");
    let deleteButtonText = await deleteButton.evaluate(el => el.innerText.trim());
    console.log("deleteButtonText", deleteButtonText);
    console.log("contains bulletin?", deleteButtonText.includes("bulletin"));
    let isBulletin = deleteButtonText.includes("bulletin");

    console.log("isBulletin", isBulletin)
    // // if (friends.includes(authorName)) {
    if (deleteBulletins && !isBulletin) {
        console.log("Message is bulletin: delete without saving");
    }
    if (!isBulletin) {
        console.log("Message is not a bulletin: proceed to save logic");
        // console.log(authorName + " is a friend, save message.");
        const msgTime = await page.$eval("time", el => el.getAttribute("dateTime"));
        
        await page.waitForSelector(".bubble");
        const paragraphs = await page.evaluate(() => {
            let paraElements = document.querySelectorAll(".bubble p");
            //array literal
            const paraList = [...paraElements];
            //gets the innerText of each element
            return paraList.map((el, index) => el.innerText);
        });
        //append message to messages.txt
        const stream = fs.createWriteStream("messages.txt", { flags: 'a' });
        stream.write(authorName + "\n");
        stream.write(msgTime + "\n");
        paragraphs.forEach((item, index) => {
            stream.write(item + "\n");
        });
        stream.end();
    }
    console.log("Delete message");
        // click delete
        await Promise.all([
            page.click(".circle-cross"),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    
        // //get iframe
        const elementHandle = await page.waitForSelector("iframe.fancybox-iframe");
        const frame = await elementHandle.contentFrame();
        await frame.waitForSelector(".navigation-footer button");
        await frame.click(".navigation-footer button");
    
}

main();