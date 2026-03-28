const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userEmail: String,
  customerName: String,
  phone: String,
  state: String,
  city: String,
  address: String,
  pincode: String,
  items: Array,
  totalAmount: Number,
  orderId: String,

  
  status: {
    type: String,
    default: "Placed"
  },
  payment: {
    type: String,
    default: "Cash on Delivery"
  },
  deliveryDate: String

}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);