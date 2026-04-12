const express = require('express');
const app = express();

// 🔥 IMPORTANT
const PORT = process.env.PORT;

// TEST ROUTE
app.get('/check', (req, res) => {
  res.status(200).send("OK");
});

// ROOT
app.get('/', (req, res) => {
  res.send("Server working ✅");
});

// START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log("🚀 Server started on port:", PORT);
});
