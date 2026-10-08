const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        title: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      fullName: { type: String, required: [true, 'Full name is required'], trim: true },
      phone: { type: String, required: [true, 'Phone is required'], trim: true },
      address: { type: String, required: [true, 'Address is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      postalCode: { type: String, required: [true, 'Postal code is required'], trim: true },
      country: { type: String, required: [true, 'Country is required'], trim: true },
    },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], required: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
