const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

// ✅ Healthcheck (MOST IMPORTANT)
app.get('/check', (req, res) => {
  res.status(200).send("OK");
});

// ✅ Basic route
app.get('/', (req, res) => {
  res.send("Server working ✅");
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port " + PORT);
});
