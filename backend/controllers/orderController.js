const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const asyncHandler = require('../utils/asyncHandler');

const ADDRESS_FIELDS = [
  ['fullName', 'Full name'],
  ['phone', 'Phone'],
  ['address', 'Address'],
  ['city', 'City'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
];
const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const round2 = (n) => Math.round(n * 100) / 100;

const restoreStock = (items) =>
  Book.bulkWrite(
    items.map((i) => ({
      updateOne: { filter: { _id: i.book }, update: { $inc: { stock: i.quantity } } },
    }))
  );

// POST /api/orders   body: { shippingAddress, paymentMethod }
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress = {}, paymentMethod } = req.body;

  const missing = ADDRESS_FIELDS.filter(([k]) => !String(shippingAddress[k] || '').trim()).map(([, label]) => label);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing shipping details: ${missing.join(', ')}`);
  }
  if (!['COD', 'ONLINE'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('Payment method must be COD or ONLINE');
  }

  // 1. read cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // 2. validate stock + 3. calculate total
  const items = [];
  for (const item of cart.items) {
    if (!item.book) {
      res.status(400);
      throw new Error('A book in your cart is no longer available. Please review your cart.');
    }
    if (item.book.stock < item.quantity) {
      res.status(400);
      throw new Error(
        item.book.stock === 0
          ? `"${item.book.title}" is out of stock`
          : `Only ${item.book.stock} cop${item.book.stock === 1 ? 'y' : 'ies'} of "${item.book.title}" available`
      );
    }
    items.push({ book: item.book._id, title: item.book.title, quantity: item.quantity, price: item.book.price });
  }
  const totalAmount = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

  // 4. create order + 5. reduce stock (atomic per book; rolled back if anything fails)
  const reserved = [];
  let order;
  try {
    for (const it of items) {
      const updated = await Book.findOneAndUpdate(
        { _id: it.book, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity } }
      );
      if (!updated) {
        const e = new Error(`"${it.title}" just sold out. Please update your cart.`);
        e.status = 400;
        throw e;
      }
      reserved.push(it);
    }

    const address = {};
    ADDRESS_FIELDS.forEach(([k]) => {
      address[k] = String(shippingAddress[k]).trim();
    });
    order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress: address,
      paymentMethod,
    });
  } catch (err) {
    if (reserved.length) await restoreStock(reserved);
    if (err.status) res.status(err.status);
    throw err;
  }

  // 6. clear cart
  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

// GET /api/orders/myorders
const getMyOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

// GET /api/orders/all (admin)   optional ?status=
const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) {
      res.status(400);
      throw new Error('Invalid status filter');
    }
    filter.status = req.query.status;
  }
  res.json(await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }));
});

// GET /api/orders/:id  (owner or admin)
const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (req.user.role !== 'admin' && String(order.user._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You are not allowed to view this order');
  }
  res.json(order);
});

// PUT /api/orders/:id/cancel  (owner or admin; only while Pending or Confirmed)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You are not allowed to cancel this order');
  }
  if (!['Pending', 'Confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error(`An order that is ${order.status.toLowerCase()} can no longer be cancelled`);
  }

  order.status = 'Cancelled';
  await order.save();
  await restoreStock(order.items);
  res.json(order);
});

// PUT /api/orders/:id/status (admin)   body: { status }
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${STATUSES.join(', ')}`);
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (['Cancelled', 'Delivered'].includes(order.status)) {
    res.status(400);
    throw new Error(`A ${order.status.toLowerCase()} order can no longer be changed`);
  }
  if (order.status === status) {
    return res.json(order);
  }

  order.status = status;
  await order.save();
  if (status === 'Cancelled') await restoreStock(order.items);
  res.json(order);
});

module.exports = { createOrder, getMyOrders, getAllOrders, getOrderById, cancelOrder, updateOrderStatus };
