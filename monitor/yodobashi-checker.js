'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const URL = 'https://www.yodobashi.com/?word=ボンボンドロップシール';

async function checkYodobashi() {
  try {
    const res = await axios.get(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(res.data);

    const items = [];

    $('.js_productList li').each((i, el) => {
      const name = $(el).find('.pName').text().trim();
      const link = 'https://www.yodobashi.com' + $(el).find('a').attr('href');
      const hasCart = $(el).find('.js_addCart').length > 0;

      if (name.includes('ボンボンドロップ')) {
        items.push({
          name,
          link,
          inStock: hasCart,
        });
      }
    });

    return items;

  } catch (err) {
    console.error('[yodobashi] エラー:', err.message);
    return [];
  }
}

module.exports = { checkYodobashi };
