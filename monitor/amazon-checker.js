'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const PRODUCTS = [
  { asin: 'B0G2RSS3HV', name: 'ボンボンドロップシール サンリオ S8815062' },
  { asin: 'B0G2RQL3RG', name: 'ボンボンドロップシール サンリオ S8815070' },
  { asin: 'B0G2RQ7QBP', name: 'ボンボンドロップシール サンリオ S8815089' },
  { asin: 'B0G2RTFMMH', name: 'ボンボンドロップシール サンリオ S8815097' },
  { asin: 'B0G2RWKZ1B', name: 'ボンボンドロップシール サンリオ S8815119' },
  { asin: 'B0G2RPXXY8', name: 'ボンボンドロップシール サンリオ S8815127' },
  { asin: 'B0G2RP9RMN', name: 'ボンボンドロップシール サンリオ S8815135' },
  { asin: 'B0G2RMGPWZ', name: 'ボンボンドロップシール S8814988' },
  { asin: 'B0G2RQGGK8', name: 'ボンボンドロップシール S8814996' },
  { asin: 'B0G2RW1FMS', name: 'ボンボンドロップシール S8815003' },
  { asin: 'B0G2RRY1T6', name: 'ボンボンドロップシール S8815011' },
  { asin: 'B0G2RPBVK3', name: 'ボンボンドロップシール S8815020' },
  { asin: 'B0G2RT9GRP', name: 'ボンボンドロップシール S8815038' },
  { asin: 'B0G2RMMFHZ', name: 'ボンボンドロップシール S8815046' },
  { asin: 'B0G2RPNBLX', name: 'ボンボンドロップシール S8815054' },
  { asin: 'B0G2RSZ4KX', name: 'ボンボンドロップシール S8815143' },
  { asin: 'B0G2RPQJ2X', name: 'ボンボンドロップシール S8815151' },
  { asin: 'B0G2RQKTBC', name: 'ボンボンドロップシール S8815160' },
  { asin: 'B0G2RQK2Y7', name: 'ボンボンドロップシール スヌーピー S8815178' },
  { asin: 'B0FN3YRZNY', name: 'ボンボンドロップシール S8542899' },
  { asin: 'B0FN41LJVC', name: 'ボンボンドロップシール S8542902' },
  { asin: 'B0FN42WHFR', name: 'ボンボンドロップシール S8542910' },
  { asin: 'B0FN42TGW4', name: 'ボンボンドロップシール ちいかわ S8542945' },
  { asin: 'B0FN3ZW94L', name: 'ボンボンドロップシール S8542929' },
  { asin: 'B0FN3ZJ1VZ', name: 'ボンボンドロップシール S8542937' },
  { asin: 'B0FN412KVB', name: 'ボンボンドロップシール S8542953' },
  { asin: 'B0FN42SFNB', name: 'ボンボンドロップシール S8542961' },
  { asin: 'B0F4CWWMTM', name: 'ボンボンドロップシール S8812543' },
  { asin: 'B0F4D3KKGJ', name: 'ボンボンドロップシール たまごっち めめっち S8812551' },
  { asin: 'B0F4CZTGD9', name: 'ボンボンドロップシール たまごっち くちぱっち S8812560' },
  { asin: 'B0F4CZNHWC', name: 'ボンボンドロップシール たまごっち S8812578' },
];

const MAX_PRICE = 550;

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

async function checkProduct(product) {
  const url = `https://www.amazon.co.jp/dp/${product.asin}`;
  let html;
  try {
    const res = await axios.get(url, { headers: REQUEST_HEADERS, timeout: 15000 });
    html = res.data;
  } catch (err) {
    console.error(`[checker] ${product.asin} エラー: ${err.message}`);
    return null;
  }
  const $ = cheerio.load(html);
  const availabilityRaw = $('#availability span').first().text().trim();
  const inStock = /在庫あり|通常\d+/.test(availabilityRaw) || (availabilityRaw === '' && $('#add-to-cart-button').length > 0);
  const priceSelectors = ['#priceblock_ourprice','#priceblock_dealprice','.a-price .a-offscreen','#price_inside_buybox','#corePrice_feature_div .a-price .a-offscreen','.priceToPay .a-offscreen'];
  let priceText = '';
  for (const sel of priceSelectors) {
    const t = $(sel).first().text().trim();
    if (t) { priceText = t; break; }
  }
  const price = priceText ? parseInt(priceText.replace(/[^0-9]/g, ''), 10) : null;
  const merchantText = [$('#merchant-info').text(), $('#tabular-buybox').text(), $('#desktop_qualifiedBuyBox').text()].join(' ');
  const soldByAmazon = merchantText.includes('Amazon.co.jp') || merchantText.includes('Amazon Japan');
  const isListPrice = price !== null && price <= MAX_PRICE;
  return { asin: product.asin, name: product.name, inStock, price, soldByAmazon, isListPrice, availabilityRaw, url };
}

function shouldNotify(result) {
  if (!result) return false;
  if (!result.inStock) return false;
  if (!result.isListPrice) return false;
  if (!result.soldByAmazon) return false;
  return true;
}

module.exports = { PRODUCTS, checkProduct, shouldNotify };
