const express = require("express");
const app = express();
app.use(express.json());

const { startMonitor, getStatus } = require('./monitor/stock-monitor');

app.post("/webhook", (req, res) => {
  console.log("受信:", req.body);
  res.send("ok");
});

app.get('/monitor/status', (req, res) => res.json(getStatus()));

app.get('/monitor', (req, res) => {
  const s = getStatus();
  const lastCheck = s.stats.lastCheckAt
    ? new Date(s.stats.lastCheckAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    : '未実行';
  const historyRows = s.recentHistory.map(h => `
    <tr>
      <td>#${h.checkNo}</td>
      <td>${h.checkedAtJST}</td>
      <td>${h.inStockItems.length > 0
        ? h.inStockItems.map(i => `<span class="badge">${i.name}</span>`).join('')
        : '<span class="none">なし</span>'}</td>
      <td>${h.errorCount}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ボンボンドロップ 在庫監視</title>
<style>
  body { font-family: sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }
  h1 { color: #e94560; }
  .cards { display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }
  .card { background: #16213e; border-radius: 12px; padding: 20px; min-width: 160px; text-align: center; }
  .card .num { font-size: 2.5em; font-weight: bold; color: #e94560; }
  .card .label { font-size: 0.85em; color: #aaa; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; background: #16213e; border-radius: 12px; overflow: hidden; }
  th { background: #e94560; padding: 10px; text-align: left; font-size: 0.9em; }
  td { padding: 10px; border-bottom: 1px solid #0f3460; font-size: 0.85em; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { background: #e94560; color: white; border-radius: 6px; padding: 2px 8px; font-size: 0.8em; display: inline-block; margin: 2px; }
  .none { color: #555; }
  .status { color: #4ecca3; font-weight: bold; }
  button { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; }
</style>
</head>
<body>
<h1>🎀 ボンボンドロップシール 在庫監視</h1>
<p class="status">● 監視中（7分ごと・31商品）</p>
<p>最終チェック: <strong>${lastCheck}</strong></p>
<button onclick="location.reload()">🔄 更新</button>

<div class="cards">
  <div class="card"><div class="num">${s.stats.totalChecks}</div><div class="label">総チェック回数</div></div>
  <div class="card"><div class="num">${s.stats.totalNotifications}</div><div class="label">LINE通知回数</div></div>
  <div class="card"><div class="num">${s.totalProducts}</div><div class="label">監視商品数</div></div>
  <div class="card"><div class="num">${s.stats.consecutiveErrors}</div><div class="label">現在のエラー数</div></div>
</div>

<h2>📋 チェック履歴（直近100件）</h2>
${s.recentHistory.length === 0
  ? '<p style="color:#555">まだ履歴がありません</p>'
  : `<table>
    <tr><th>#</th><th>日時（JST）</th><th>在庫あり商品</th><th>エラー数</th></tr>
    ${historyRows}
  </table>`}
</body>
</html>`;
  res.send(html);
});

startMonitor();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server running"));
