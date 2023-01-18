const puppeteer = require('puppeteer');
const fs = require('fs');


    (async () => {
        const browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        const url = "https://arc-sos.state.al.us/CGI/CORPNAME.MBR/INPUT";

        await page.goto(url);
        //$$ for multiple elements
        const rows = await page.$$('#block-sos-content div blockquote p');
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            //$ for single elements
            const label = await row.$eval('p a', element => element.textContent);
            console.log(label)
        }

        await browser.close();

    })();