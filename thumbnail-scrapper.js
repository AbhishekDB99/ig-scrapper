const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const posts = JSON.parse(fs.readFileSync("saved_with_thumbnails.json", "utf-8"));

async function downloadImage(url, filepath) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(filepath, buffer);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const post of posts) {
    let thumbnail = post.thumbnail;

    if (!thumbnail || thumbnail === "placeholder.jpg") {
      try {
        await page.goto(post.url, { waitUntil: "networkidle2" });
        thumbnail = await page.$eval(
          'meta[property="og:image"]',
          el => el.content
        );
        console.log(`Fetched new thumbnail for ${post.title}`);
      } catch (err) {
        console.log(`Still no thumbnail for ${post.title}: ${err.message}`);
        thumbnail = "placeholder.jpg";
      }
    }

    // try downloading thumbnail
    if (thumbnail && thumbnail !== "placeholder.jpg") {
      const filename = `${post.title}_${post.timestamp}.jpg`;
      const filepath = path.join("thumbnails", filename);

      try {
        console.log(`⬇️ Downloading thumbnail for ${post.title}...`);
        await downloadImage(thumbnail, filepath);
        console.log(`✅ Saved as ${filepath}`);
      } catch (err) {
        console.log(`❌ Failed to download ${thumbnail}: ${err.message}`);
      }
    }

    results.push({
      title: post.title,
      url: post.url,
      thumbnail,
      timestamp: post.timestamp
    });
  }

  await browser.close();

  fs.writeFileSync(
    "saved_with_final_thumbnails.json",
    JSON.stringify(results, null, 2)
  );

  console.log("Done! All posts processed.");
})();
