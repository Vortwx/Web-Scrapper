import puppeteer from 'puppeteer';
import fs from 'fs';
import fsp from 'fs/promises';

var dateToEnd = new Date('Sept 26 2024')
var dateValid = true

function sleep(){
    return new Promise(resolve => setTimeout(resolve,500))
}

async function toClick(){
    const browser = await puppeteer.launch({headless: false});
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
            
            if(datePublished < dateToEnd) return

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

async function display(){
    let response = await fsp.readFile('headlines.json')
    let headlines = JSON.parse(response)
    console.log(headlines)
    const list = document.getElementById('articles')
    headlines.forEach(headline => {
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = headline.link
        a.textContent = headline.caption
        li.appendChild(a)
        list.appendChild(li)
})
}

async function main(){
    await toClick()
    display()
}

main()


