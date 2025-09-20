const puppeteer = require('puppeteer');
const fs = require('fs');

const savedPosts = JSON.parse(fs.readFileSync("saved_posts.json", "utf-8")).saved_saved_media;
const results = [];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const post of savedPosts) {
    const url = post.string_map_data["Saved on"].href;
    const timestamp = post.string_map_data["Saved on"].timestamp;
    let thumbnail = '';

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Try to get og:image
      thumbnail = await page.$eval(
        'meta[property="og:image"]',
        el => el.content
      );
      console.log(`Thumbnail found for ${post.title}`);
    } catch (err) {
      console.log(`No thumbnail for ${post.title}: ${err.message}`);
      // fallback: use a placeholder image
      thumbnail = 'placeholder.jpg'; // make a local placeholder or a public URL
    }

    results.push({
      title: post.title,
      url,
      thumbnail,
      timestamp
    });
  }

  await browser.close();

  fs.writeFileSync('saved_with_thumbnails.json', JSON.stringify(results, null, 2));
  console.log('Scraping finished, JSON saved!');
})();
