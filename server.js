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

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));

// ================== DB CONNECT ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB connected");

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1); // 🔥 crash properly so Railway shows logs
});

// ================== ROUTES ==================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

app.get('/Product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'Product.html'));
});

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

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // ✅ THIS IS WHAT YOU WERE ASKING ABOUT
    res.json({
      email: user.email,
      name: user.name
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================== CART ==================
// ADD TO CART
app.post('/api/Cart', async (req, res) => {
  try {
    const { userEmail, name, price, image, size, quantity } = req.body;

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
    console.error(err);
    res.status(500).json({ error: "Failed to add cart" });
  }
});
// GET
app.get('/api/Cart/:email', async (req, res) => {
  const items = await Cart.find({
  const email = (req.params.email || "").toLowerCase();
  });
  res.json(items);
});

// DELETE
app.delete('/api/Cart/:id', async (req, res) => {
  await Cart.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

// UPDATE
app.put('/api/Cart/:id', async (req, res) => {
  await Cart.updateOne(
    { _id: req.params.id },
    { $set: { quantity: req.body.quantity } }
  );
  res.json({ success: true });
});


// ================== PLACE ORDER ==================
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

    // ✅ Delivery date (5 days later)
    const today = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(today.getDate() + 5);

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
      status: "Placed",                    // ✅ NEW
      payment: "Cash on Delivery",         // ✅ NEW
      deliveryDate: deliveryDate.toLocaleDateString()
    });

    await newOrder.save();

    res.json({
      success: true,
      orderId: orderId
    });

  } catch (err) {
    res.status(500).json({ error: "Order failed" });
  }
});
app.delete('/api/Order/:id', async (req, res) => {
  try {

    const deleted = await Order.findOneAndDelete({
      orderId: req.params.id   // ✅ FIX HERE
    });

    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order cancelled successfully" });

  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// GET ORDERS
// GET user orders

// GET ORDERS
app.get("/api/orders/:email", async (req, res) => {
  try{
    const orders = await Order.find({
      const email = (req.params.email || "").toLowerCase();
    }).sort({ createdAt: -1 });

    res.json(orders);
  }catch(err){
    console.error(err); 
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE ALL ORDERS
app.delete('/api/orders/:email', async (req, res) => {
  try {
    await Order.deleteMany({
      const email = (req.params.email || "").toLowerCase();
    });

    res.json({ message: "All orders deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete orders" });
  }
});
// ================== UPDATE ORDER STATUS ==================
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
    console.log("Contact data received:", req.body); // DEBUG

    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      message
    });

    await newContact.save();

    res.status(200).json({ message: "Message saved successfully!" });

  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
setInterval(async () => {

  const orders = await Order.find();

  for (let order of orders) {

    const createdDate = new Date(order.createdAt);
    const today = new Date();

    const diffTime = today - createdDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 🔥 DAY BASED STATUS
    if (diffDays === 0) {
      order.status = "Placed";
    } 
    else if (diffDays === 1) {
      order.status = "Shipped";
    } 
    else if (diffDays === 2) {
      order.status = "Out for Delivery";
    } 
    else if (diffDays >= 3) {
      order.status = "Delivered";
    }

    await order.save();
  }

}, 60000); // check every 1 min

