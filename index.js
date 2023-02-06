import puppeteer from "puppeteer";
import dotenv from "dotenv";
import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { LoremIpsum } from "lorem-ipsum";
import randomDate from "random-datetime";

import { visitLoginPage, visitMessagesPage, visitThreadPage } from "./pages.js";
import { saveThreadMessages, removeThread, sendFake } from "./helpers.js";

dotenv.config();

//set up express
const app = express();
app.use(express.json());
app.listen(3000);
app.set('view engine', 'ejs');

//css *to be changed, this css sucks*
app.use(express.static('public'));

//this middleware gives access to form data
app.use(express.urlencoded({ extended: true }));

//routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Home'
    });
});

app.get('/send-msg', (req, res) => {
    res.render('send-msg', {
        title: 'Fake Message Maker'
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About'
    });
});

app.post('/send-msg', (req, res) => {
    const targetEmail = req.body.email;
    sendMail(targetEmail);

    res.render('success', {
        title: 'Success'
    });
});

app.post('/fake-msg', (req, res) => {
    const numMessages = req.body.numMessages;
    const user = req.body.targetUser;
    const fakeAttach = fakeMessages(numMessages);

    sendFake(fakeAttach, user);

    res.render('success', {
        title: 'Success'
    });
})

//delete functions called here
app.post('/delete', (req, res) => {
    const creds = req.body;
    const email = creds.email;
    const pass = creds.password

    const fileName = crypto.createHash('md5').update(email).digest('hex') + ".txt";

    console.log(fileName);
    main(email, pass, fileName);

    //dev-only: this may need to be put somewhere else
    sendMail('michaelwcho@hotmail.com')
    
    // sendMail(email);

    res.render('index', {
        title: 'Home'
    })
});

//404
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found'
    });
});

//main functionality is here
async function main (email, pass, fileName) {
    // config
    const baseUrl = process.env.BASE_URL;
    const skipBulletins = process.env.DEV_DEL_BULLETINS === "true";

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

    await loginPage.login(email, pass);

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

            saveThreadMessages({ messages, userName, fileName });
        }

        await removeThread(page, { threadId, url: `${baseUrl}/dashboard/popups/delete-private-message-thread` });

        break;
    }

    await browser.close();
}


const sendMail = (targetEmail) => {
    const user = process.env.DEV_FAKE_EMAIL;
    const pass = process.env.DEV_FAKE_PASS;
    
    console.log('fake messages to: ', targetEmail);

    //email stuff
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });

    const mailOptions = {
        from: user,
        to: targetEmail,
        subject: 'Sending Email Using Node.js',
        text: 'that was easy!'
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        } else {
            console.log('Email sent: ' + info.response)
        }
    });
}

/**numMessages: {number} The number of fake messages you want 
 * returns an array of objects, each a message
*/
const fakeMessages = (numMessages) => {
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

