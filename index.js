const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("受信:", req.body);
  res.send("ok");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server running"));
