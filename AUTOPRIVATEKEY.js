const fs = require('fs').promises;
const puppeteer = require('puppeteer');

async function autoType(page, selector, text, delay = 1) {
    await page.focus(selector);
    await page.$eval(selector, input => input.value = '');
    await page.keyboard.type(text, { delay });
}

async function checkForError(page) {
    try {
        const errorElement = await page.$('.cs-form-element__error');
        return errorElement ? await errorElement.evaluate(node => node.textContent.trim()) : null;
    } catch (error) {
        console.error('Error checking for error:', error);
        return null;
    }
}

async function enterPassphrases(passphrases, page, checkpoint) {
    let startFromIndex = checkpoint ? parseInt(checkpoint) : 0;

    for (let i = startFromIndex; i < passphrases.length; i++) {
        const passphrase = passphrases[i];
        const inputSelector = '.cs-form-input__input';

        await waitForElement(page, inputSelector);
        await autoType(page, inputSelector, passphrase.trim());
        await delay(200);

        await page.click('.cs-button--primary');
        
        await waitForElement(page, '.cs-button--primary:not(.cs-button--loading)');

        console.log(`Typed passphrase from line ${i + 1}`);
        await updateCheckpoint(i + 1);

        const errorMessage = await checkForError(page);
        if (errorMessage) {
            console.log('Error:', errorMessage);
            continue;
        }
    }

    console.log('All passphrases processed.');
        
}

async function waitForElement(page, selector, interval = 100, timeout = 0) {
    const start = Date.now();
    while (true) {
        const element = await page.$(selector);
        if (element) {
            return element;
        }
        if (timeout && (Date.now() - start) > timeout) {
            throw new Error(`Timeout waiting for selector: ${selector}`);
        }
        await delay(interval);
    }
}

async function updateCheckpoint(index) {
    try {
        await fs.writeFile('privatekeycheckpoint.txt', String(index));
    } catch (error) {
        console.error('Error updating checkpoint:', error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    let textFromFile = '';
    try {
        textFromFile = await fs.readFile('privateethkey.txt', 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
        return;
    }

    let checkpoint = 0;
    try {
        const checkpointData = await fs.readFile('privatekeycheckpoint.txt', 'utf-8');
        checkpoint = parseInt(checkpointData);
    } catch (error) {
        console.error('Error reading checkpoint:', error);
    }

    const passphrases = textFromFile.split(/\r?\n/);

    const browser = await puppeteer.launch({
        headless: false,
        timeout: 0, // Disable browser timeout
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null, // Allows the browser window to be maximized
        protocolTimeout: 0, // Disable protocol timeout
    });

    const page = await browser.newPage();

    page.on('error', err => {
        console.error('Page crashed:', err);
    });

    page.on('pageerror', err => {
        console.error('Page error:', err);
    });

    page.on('requestfailed', req => {
        console.error('Request failed:', req.url());
    });

    await page.goto('https://coin.space/wallet/');
    await waitForElement(page, '.crypto-import-step-private-key__info');

    await enterPassphrases(passphrases, page, checkpoint);
})();
