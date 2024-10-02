const puppeteer = require('puppeteer');
const fs = require('fs');
const fsp = require('fs').promises;

var dateToEnd = new Date('Jan 1 2024')
var dateValid = true

function sleep(){
    return new Promise(resolve => setTimeout(resolve,500))
}

async function toClick(){
    const browser = await puppeteer.launch({headless: true, timeout: 300000000});
    const page = await browser.newPage();

    await page.goto('https://sea.mashable.com/');
    await page.waitForSelector('#showmore');


    while(dateValid){
        const button = await page.$('button#showmore');
        if (button) {
            await button.scrollIntoView();
        }

        const isEnabled = await page.evaluate(btn => btn && !btn.disabled, button);
        if (!isEnabled) {
            console.log('Button is not enabled, exiting.');
            break; 
        }

        await sleep()
        await button.click()
        await page.waitForSelector('button#showmore', {visible: true, timeout: 5000})

        const datas = await page.evaluate((dateToEnd) => {
            const articles = document.querySelectorAll('div#new li.blogroll.ARTICLE');
            let results = []
            let stopProcessing = false
    
            articles.forEach(article => {
    
                const caption = article.querySelector('.caption')?.innerText.trim();
                
                const timeElement = article.querySelector('.datepublished');
    
                const link = article.querySelector('a').href;
    
                var datePublished = new Date(timeElement.innerText.replace(/[.,]/g, ''));

                if(datePublished.getTime() < dateToEnd) {
                    stopProcessing = true
                    return
                }
    
                results.push(
                    datePublished.toString()
                   );
            });
    
            return {results, stopProcessing};
        }, dateToEnd);

        for(const date of datas.results){
            const recreate = new Date(date)
            if(recreate.getTime()<dateToEnd.getTime()){
                dateValid = false
            }
        }
        
    }

    const data = await page.evaluate((dateToEnd) => {
        const articles = document.querySelectorAll('div#new li.blogroll.ARTICLE');
        let results = [];

        articles.forEach(article => {

            const caption = article.querySelector('.caption')?.innerText.trim();
            
            const timeElement = article.querySelector('.datepublished');

            const link = article.querySelector('a').href;

            const datePublished = new Date(timeElement.innerText.replace(/[.,]/g, ''));
            
            if(datePublished.getTime() < dateToEnd) return

            results.push({
                caption: caption,
                datePublished: datePublished.toString(),
                link: link
            });
        });

        return results;
    });

    await browser.close();
    fs.writeFileSync('headlines.json', JSON.stringify(data));
    console.log('Headlines saved to headlines.json');
}

toClick()
