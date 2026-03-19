function createPuppeteerService({ puppeteer, logger = console }) {
  async function getPageText(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      if (url.includes('zacks.com')) {
        await page.waitForSelector('.show_article');
        await page.click('.show_article');
      }

      const text = await page.evaluate(() => document.body.innerText);
      await browser.close();
      return text;
    } catch (error) {
      await browser.close();
      logger.log(error);
      return undefined;
    }
  }

  return {
    getPageText,
  };
}

module.exports = {
  createPuppeteerService,
};
