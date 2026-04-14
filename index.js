const express = require("express");
const app = express();
app.use(express.json());

const { startMonitor, getStatus } = require('./monitor/stock-monitor');

app.post("/webhook", (req, res) => {
  console.log("受信:", req.body);
  res.send("ok");
});

app.get('/monitor/status', (req, res) => res.json(getStatus()));

startMonitor();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server running"));
