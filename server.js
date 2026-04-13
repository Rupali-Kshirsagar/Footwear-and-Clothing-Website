const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./model/User');
const Contact = require('./model/Contact');
const Cart = require('./model/Cart');
const Order = require('./model/Order');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 8080;

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));

// ================== HEALTH CHECK ==================
//app.get('/check', (req, res) => {
 // res.status(200).send("OK");
//});

// ================== BASIC ROUTES ==================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

app.get('/Product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'Product.html'));
});
app.get('/confirmation.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'confirmation.html'));
});

// ================== START SERVER FIRST ==================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ================== CONNECT DATABASE ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ================== SIGNUP ==================
app.post('/api/Signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email exists" });

    const hashed = await bcrypt.hash(password, 10);

    await new User({
      name,
      email: email.toLowerCase(),
      password: hashed
    }).save();

    res.json({ message: "Signup successful" });

  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// ================== LOGIN ==================
app.post('/api/Login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    res.json({
      email: user.email,
      name: user.name
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================== CART ==================
app.post('/api/Cart', async (req, res) => {
  try {
    const { userEmail, name, price, image, size, quantity } = req.body;

    // ✅ VALIDATION (VERY IMPORTANT)
    if (!userEmail || !name || !price || !image || !size || !quantity) {
      return res.status(400).json({ error: "All fields required" });
    }

    const newItem = new Cart({
      userEmail: userEmail.toLowerCase(),
      name,
      price,
      image,
      size,
      quantity
    });

    await newItem.save();

    res.json({ success: true });

  } catch (err) {
    console.error("Cart Error:", err);   // 🔥 SEE ERROR IN LOGS
    res.status(500).json({ error: "Failed to add cart" });
  }
});

app.get('/api/Cart/:email', async (req, res) => {
  try {
    const email = (req.params.email || "").toLowerCase();
    const items = await Cart.find({ userEmail: email });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Cart fetch failed" });
  }
});

app.delete('/api/Cart/:id', async (req, res) => {
  try {
    await Cart.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.put('/api/Cart/:id', async (req, res) => {
  try {
    await Cart.updateOne(
      { _id: req.params.id },
      { $set: { quantity: req.body.quantity } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});
// ================== ORDER ==================
app.post('/api/Order', async (req, res) => {
  try {
    const {
      userEmail,
      customerName,
      phone,
      state,
      city,
      address,
      pincode,
      items,
      totalAmount
    } = req.body;

    const orderId = "ORD" + Date.now();

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const newOrder = new Order({
      userEmail: userEmail.toLowerCase(),
      customerName,
      phone,
      state,
      city,
      address,
      pincode,
      items,
      totalAmount,
      orderId,
      status: "Placed",
      payment: "Cash on Delivery",
      deliveryDate: deliveryDate.toLocaleDateString()
    });

    await newOrder.save();

    res.json({ success: true, orderId });

  } catch (err) {
    res.status(500).json({ error: "Order failed" });
  }
});

app.delete('/api/Order/:id', async (req, res) => {
  try {
    const deleted = await Order.findOneAndDelete({ orderId: req.params.id });

    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order cancelled successfully" });

  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

app.get("/api/orders/:email", async (req, res) => {
  try {
    const email = (req.params.email || "").toLowerCase();

    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete('/api/orders/:email', async (req, res) => {
  try {
    const email = (req.params.email || "").toLowerCase();

    await Order.deleteMany({ userEmail: email });
    res.json({ message: "All orders deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete orders" });
  }
});

app.put('/api/Order/status/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const steps = ["Placed", "Shipped", "Out for Delivery", "Delivered"];
    const index = steps.indexOf(order.status);

    if (index < steps.length - 1) {
      order.status = steps[index + 1];
      await order.save();
    }

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ================== CONTACT ==================
app.post('/api/Contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    const newContact = new Contact({ name, email, phone, message });
    await newContact.save();

    res.json({ message: "Message saved successfully!" });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================== AUTO STATUS UPDATE ==================
setInterval(async () => {
  try {

    if (mongoose.connection.readyState !== 1) return;

    const orders = await Order.find();

    for (let order of orders) {
      const createdDate = new Date(order.createdAt);
      const today = new Date();

      const diffDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) order.status = "Placed";
      else if (diffDays === 1) order.status = "Shipped";
      else if (diffDays === 2) order.status = "Out for Delivery";
      else order.status = "Delivered";

      await order.save();
    }

  } catch (err) {
    console.error("Auto status error:", err);
  }
}, 60000);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'index.html'));
});
