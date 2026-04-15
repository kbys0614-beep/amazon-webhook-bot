'use strict';

const axios = require('axios');

const LINE_API = 'https://api.line.me/v2/bot/message/push';

async function sendLineNotification(message) {
  const token = 'Ni1Xbfumk35AeFryJR58Plm7XdTV70cGcYOzDrg6NN21RPYFGe8tzilz+keYRDtGRg8H4NHpL07CEdN5NGjmCYn9q5+rM4mwc8EAXMM5UG9RqteQ3iQ0Yu65w8o8N9yBiqIHdBjVdxbeXNWquimISwdB04t89/1O/w1cDnyilFU=';
  const userId = 'Ub569c1d4ef618a4c4dbdb173f602c1bd';
  try {
    await axios.post(LINE_API, {
      to: userId,
      messages: [{ type: 'text', text: message }],
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });
    console.log('[line-notifier] LINE通知送信成功');
    return true;
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[line-notifier] LINE通知送信失敗: ${detail}`);
    return false;
  }
}

async function notifyInStock(status) {
  const priceStr = status.price ? `¥${status.price.toLocaleString()}` : '価格取得中';
  const seller = status.soldByAmazon ? 'Amazon.co.jp（直販）' : 'マーケットプレイス';
  const message =
    `🎉【在庫補充】${status.name}\n` +
    `━━━━━━━━━━━━━━\n` +
    `✅ 在庫あり（定価）\n` +
    `💰 価格: ${priceStr}\n` +
    `🏪 販売: ${seller}\n` +
    `━━━━━━━━━━━━━━\n` +
    `🔗 ${status.url}\n` +
    `⏰ ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
  return sendLineNotification(message);
}

async function notifyError(detail) {
  const message =
    `⚠️【監視エラー】ボンボンドロップシール\n` +
    `詳細: ${detail}\n` +
    `⏰ ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
  return sendLineNotification(message);
}

module.exports = { sendLineNotification, notifyInStock, notifyError };
