'use strict';

const cron = require('node-cron');
const { PRODUCTS, checkProduct, shouldNotify } = require('./amazon-checker');
const { notifyInStock, notifyError } = require('./line-notifier');

const productStates = new Map(
  PRODUCTS.map(p => [p.asin, { lastInStock: false, notifiedAt: null }])
);

const stats = {
  totalChecks: 0,
  totalNotifications: 0,
  consecutiveErrors: 0,
  lastCheckAt: null,
};

const checkHistory = [];
const MAX_HISTORY = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCheck() {
  stats.totalChecks++;
  stats.lastCheckAt = new Date().toISOString();
  const jst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  console.log(`\n[monitor] === チェック #${stats.totalChecks} 開始 (${jst}) ===`);

  let errorCount = 0;
  const checkResult = {
    checkNo: stats.totalChecks,
    checkedAt: stats.lastCheckAt,
    checkedAtJST: jst,
    inStockItems: [],
    errorCount: 0,
  };

  for (const product of PRODUCTS) {
    const result = await checkProduct(product);
    if (!result) {
      errorCount++;
      await sleep(3000);
      continue;
    }
    const state = productStates.get(product.asin);
    const notify = shouldNotify(result);
    if (notify) {
      checkResult.inStockItems.push({ asin: product.asin, name: product.name, price: result.pri
