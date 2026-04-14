'use strict';

const axios = require('axios');

const LINE_API = 'https://api.line.me/v2/bot/message/push';

async function sendLineNotification(message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) {
    console.error('[line-notifier] LINE_CHANNEL_ACCESS_TOKEN または LINE_USER_ID が未設定です');
    return false;
  }
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
