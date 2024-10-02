const puppeteer = require('puppeteer');

async function toScrap(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://sea.mashable.com/');

    const data = await page.evaluate(() => {
        // Example: Select all article titles (adjust the selector based on your need)
        const articles = document.querySelectorAll('li.blogroll.ARTICLE');
        let results = [];

        articles.forEach(article => {
            // Get the article's title or caption
            const caption = article.querySelector('.caption')?.innerText.trim();
            
            // Get the publication date
            const timeElement = article.querySelector('.datepublished');

            const datePublished = new Date(timeElement.innerText.replace(/[.,]/g, ''));

            // Store the article's data
            results.push({
                caption: caption,
                datePublished: datePublished,
            });
        });

        return results;
    });

    console.log(data);
    await browser.close();
}

//toScrap();

console.log(new Date('Sept 30 2024').toString());

