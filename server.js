const express = require('express');
const app = express();

// ✅ SAFE PORT FIX
const PORT = process.env.PORT || 8080;

// ✅ Healthcheck (Railway)
app.get('/check', (req, res) => {
  res.status(200).send("OK");
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send("Server working ✅");
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log("🚀 Server started on port:", PORT);
});
