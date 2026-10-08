const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// Populates books, drops items whose book was deleted, and returns a client-friendly shape.
const formatCart = async (cart) => {
  await cart.populate('items.book');
  const valid = cart.items.filter((i) => i.book);
  if (valid.length !== cart.items.length) {
    cart.items = valid.map((i) => ({ book: i.book._id, quantity: i.quantity }));
    await cart.save();
    await cart.populate('items.book');
  }
  const items = cart.items.map((i) => ({ book: i.book, quantity: i.quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.book.price * i.quantity, 0);
  return {
    _id: cart._id,
    items,
    totalItems: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
  };
};

const parseQuantity = (value, res) => {
  const q = Number(value);
  if (!Number.isInteger(q) || q < 1) {
    res.status(400);
    throw new Error('Quantity must be a whole number of at least 1');
  }
  return q;
};

const requireValidId = (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid book id');
  }
};

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json(await formatCart(cart));
});

// POST /api/cart   body: { bookId, quantity? }
const addToCart = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  requireValidId(bookId, res);
  const quantity = parseQuantity(req.body.quantity === undefined ? 1 : req.body.quantity, res);

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  if (book.stock < 1) {
    res.status(400);
    throw new Error(`"${book.title}" is out of stock`);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => String(i.book) === String(book._id));
  const newQty = (existing ? existing.quantity : 0) + quantity;

  if (newQty > book.stock) {
    res.status(400);
    throw new Error(`Only ${book.stock} cop${book.stock === 1 ? 'y' : 'ies'} of "${book.title}" available`);
  }

  if (existing) existing.quantity = newQty;
  else cart.items.push({ book: book._id, quantity });
  await cart.save();

  res.status(201).json(await formatCart(cart));
});

// PUT /api/cart/:bookId   body: { quantity }   (sets the quantity)
const updateCartItem = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  requireValidId(bookId, res);
  const quantity = parseQuantity(req.body.quantity, res);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => String(i.book) === String(bookId));
  if (!item) {
    res.status(404);
    throw new Error('Book is not in your cart');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book no longer exists');
  }
  if (quantity > book.stock) {
    res.status(400);
    throw new Error(`Only ${book.stock} cop${book.stock === 1 ? 'y' : 'ies'} of "${book.title}" available`);
  }

  item.quantity = quantity;
  await cart.save();
  res.json(await formatCart(cart));
});

// DELETE /api/cart/:bookId
const removeCartItem = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  requireValidId(bookId, res);
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.book) !== String(bookId));
  await cart.save();
  res.json(await formatCart(cart));
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(await formatCart(cart));
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
