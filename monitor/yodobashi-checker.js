'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const URL = 'https://www.yodobashi.com/?word=ボンボンドロップシール';

async function checkYodobashi() {
  try {
    const res = await axios.get(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text',
      decompress: true,
      validateStatus: () => true,
    });

    if (res.status >= 400) {
      console.error(`[yodobashi] HTTP ${res.status}`);
      console.error(`[yodobashi] BODY=${String(res.data).slice(0, 300)}`);
      return [];
    }

    const $ = cheerio.load(res.data);
    const items = [];

    $('li').each((i, el) => {
      const text = $(el).text();
      const name = $(el).find('a').first().text().trim();
      const href = $(el).find('a').first().attr('href') || '';
      const hasCart =
        text.includes('カートに入れる') ||
        text.includes('在庫あり') ||
        $(el).html()?.includes('カートに入れる');

      if (text.includes('ボンボンドロップ')) {
        items.push({
          name: name || '名称取得失敗',
          link: href.startsWith('http') ? href : `https://www.yodobashi.com${href}`,
          inStock: !!hasCart,
        });
      }
    });

    console.log(`[yodobashi] 候補件数=${items.length}`);
    return items;
  } catch (err) {
    console.error(`[yodobashi] 通信エラー: ${err.message}`);
    console.error(`[yodobashi] CODE=${err.code || 'N/A'}`);
    return [];
  }
}

module.exports = { checkYodobashi };
