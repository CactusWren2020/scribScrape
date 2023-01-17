# scribScrape
delete private messages

This is a TOP SECRET repo that uses puppeteer and a .env file to login to Scrib, delete private messages, and save non-bulletin messages to a text file on your computer.

Here are the required configuration in the .env file, which needs to be in the root:

DEV_LOGIN =https://www.scribophile.com/dashboard/login
DEV_EMAIL = [your email associated with the Scrib account]
DEV_PASS = [your Scrib password]
DEV_DEL_BULLETINS =[true if you want to delete bulletins without saving them--recommended, those are usually trash]
DEV_FRIENDS =[friend list is not currently used, but will in the future]
