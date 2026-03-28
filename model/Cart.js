const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userEmail: String, // To track which user owns the cart
    name: String,
    price: Number,
    image: String,
    size: String,
    quantity: { type: Number, default: 1 }
});

module.exports = mongoose.model('Cart', CartSchema);