const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config()

 

async function main () {
    const browser = await puppeteer.launch({
        headless: false
    });

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
    
    const messageList = await page.$$(".message-list tr");

    for (message of messageList) {

    //get first message
        await page.waitForSelector(".message-list tr");
        await page.click(".message-list tr");

    //wait for the message to load
    await page.waitForSelector(".circle-cross");

    //get time and message text
    const msgTime = await page.$eval("time", el => el.getAttribute("dateTime"));
    const paragraphs = await page.evaluate(() => {
        let paraElements = document.querySelectorAll(".bubble p");
        //array literal
        const paraList = [...paraElements];
        //gets the innerText of each element
        return paraList.map((el, index) => el.innerText);
    });

    //get author name
    await page.waitForSelector(".user p a")
    let authorLink = await page.$(".user p a")
    let authorName = await authorLink.evaluate(el => el.innerText.trim());
        
    //append message to messages.txt
        console.log("Saving the message from " + authorName);
    const stream = fs.createWriteStream("messages.txt", { flags: 'a' });
    stream.write(authorName + "\n");
    stream.write(msgTime + "\n");
    paragraphs.forEach((item, index) => {
        stream.write(item + "\n");
    });
    stream.end();

    //delete the message
    await page.click(".circle-cross");
    
        console.log("deleting")
    const elementHandle = await page.waitForSelector("iframe.fancybox-iframe");
    const frame = await elementHandle.contentFrame();
    const button = await frame.waitForSelector(".navigation-footer button");
    await button.evaluate(el => el.click())
}
    
    // //get status as a bulletin
    // await page.waitForSelector(".header-bar .circle-cross")
    // let deleteButton = await page.$(".header-bar .circle-cross");
    // let deleteButtonText = await deleteButton.evaluate(el => el.innerText.trim());
    // let isBulletin = deleteButtonText.includes("bulletin");
    // console.log("isBulletin", isBulletin)

    // // // if (friends.includes(authorName)) {
    // if (deleteBulletins && !isBulletin) {
    //     console.log("Message is bulletin: delete without saving");
    // }
    // if (!isBulletin) {
    //     console.log("Message is not a bulletin: proceed to save logic");
    //     // console.log(authorName + " is a friend, save message.");
    //     const msgTime = await page.$eval("time", el => el.getAttribute("dateTime"));
    
    await browser.close()
    
}


main();