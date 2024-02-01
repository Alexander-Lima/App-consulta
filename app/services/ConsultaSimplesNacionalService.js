module.exports = function() {
    this.isOptanteSimples = (clientCode) => {
        return new Promise((res, rej) => {
            const puppeteerExtra = require('puppeteer-extra');
            const Stealth = require('puppeteer-extra-plugin-stealth');
            puppeteerExtra.use(Stealth());
            
            (async () => {
                const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
                const browser = await puppeteerExtra.launch({headless: "new"});
                const page = await browser.newPage();
                const formSelector = '.form-control.numeric';
                const buttonSelector = '.btn.btn-verde.h-captcha';
                const searchSelector = '.spanValorVerde';
                const url = 'https://consopt.www8.receita.fazenda.gov.br/consultaoptantes/Home/ConsultarCnpj';

                page.setUserAgent(userAgent);
                await page.goto(url);
                await page.waitForSelector(formSelector);
                await page.type(formSelector, clientCode);
                await page.click(buttonSelector);
                await page.waitForTimeout(5000);
                const resultElements = 
                    await page.evaluate((searchSelector) => {
                        const elements = Array.from(document.querySelectorAll(searchSelector));
                        return elements.map(el => el.textContent);
                    }, searchSelector);
                await browser.close();
                if(resultElements.length > 0) {
                    res(isOptante(resultElements));
                } else {
                    rej();
                }
            })();
        })
    }
    return this; 
}

function isOptante(resultElements) {
    for(element of resultElements) {
        if(element.toUpperCase().includes("NÃO OPTANTE")) {
            return false;
        }
    }
    return true;
}