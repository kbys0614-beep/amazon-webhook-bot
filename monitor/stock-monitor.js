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

// 直近100件のチェック履歴
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
      checkResult.inStockItems.push({ asin: product.asin, name: product.name, price: result.price });
      if (!state.lastInStock) {
        console.log(`[monitor] 🎉 在庫復活: ${product.name}`);
        await notifyInStock(result);
        state.notifiedAt = new Date().toISOString();
        stats.totalNotifications++;
      }
      state.lastInStock = true;
    } else {
      state.lastInStock = false;
    }
    await sleep(parseInt(process.env.REQUEST_INTERVAL_MS || '3000'));
  }

  checkResult.errorCount = errorCount;

  // 履歴に追加（最大100件）
  checkHistory.unshift(checkResult);
  if (checkHistory.length > MAX_HISTORY) checkHistory.pop();

  if (errorCount > 0) stats.consecutiveErrors += errorCount;
  else stats.consecutiveErrors = 0;

  if (stats.consecutiveErrors >= 30) {
    await notifyError(`連続してAmazonページ取得に失敗しています（失敗数: ${stats.consecutiveErrors}）`);
    stats.consecutiveErrors = 0;
  }

  console.log(`[monitor] === チェック完了 (失敗: ${errorCount}/${PRODUCTS.length}) ===\n`);
}

function startMonitor() {
  const schedule = process.env.CRON_SCHEDULE || '*/7 * * * *';
  console.log(`[monitor] 監視開始: スケジュール="${schedule}" 対象=${PRODUCTS.length}商品`);
  runCheck();
  cron.schedule(schedule, runCheck, { timezone: 'Asia/Tokyo' });
}

function getStatus() {
  const states = {};
  for (const [asin, state] of productStates.entries()) {
    states[asin] = state;
  }
  return {
    stats,
    totalProducts: PRODUCTS.length,
    productStates: states,
    recentHistory: checkHistory,
  };
}

module.exports = { startMonitor, getStatus };
