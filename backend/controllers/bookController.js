const mongoose = require('mongoose');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  title: { title: 1 },
};

// GET /api/books?search=&category=&sort=&featured=&limit=
const getBooks = asyncHandler(async (req, res) => {
  const { search, category, sort, featured, limit } = req.query;
  const filter = {};

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: rx }, { author: rx }];
  }
  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      res.status(400);
      throw new Error('Invalid category id');
    }
    filter.category = category;
  }
  if (featured === 'true') filter.featured = true;

  let query = Book.find(filter).populate('category', 'name').sort(SORTS[sort] || SORTS.newest);
  const max = parseInt(limit, 10);
  if (Number.isInteger(max) && max > 0) query = query.limit(Math.min(max, 100));

  res.json(await query);
});

// GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate('category', 'name');
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json(book);
});

const validateBookFields = (body, res, { partial }) => {
  const errors = [];
  const has = (k) => body[k] !== undefined;
  const need = (k, label) => {
    if (!partial && (body[k] === undefined || String(body[k]).trim() === '')) errors.push(`${label} is required`);
  };
  need('title', 'Title');
  need('author', 'Author');
  need('description', 'Description');
  need('price', 'Price');
  need('category', 'Category');
  need('ISBN', 'ISBN');
  need('stock', 'Stock');

  if (has('price') && (isNaN(Number(body.price)) || Number(body.price) < 0)) errors.push('Price must be a number 0 or greater');
  if (has('stock') && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) errors.push('Stock must be a whole number 0 or greater');
  if (has('category') && !mongoose.isValidObjectId(body.category)) errors.push('Category is invalid');

  if (errors.length) {
    res.status(400);
    throw new Error(errors.join('. '));
  }
};

const EDITABLE = ['title', 'author', 'description', 'price', 'category', 'ISBN', 'stock', 'image', 'featured'];

// POST /api/books (admin)
const createBook = asyncHandler(async (req, res) => {
  validateBookFields(req.body, res, { partial: false });

  if (!(await Category.exists({ _id: req.body.category }))) {
    res.status(400);
    throw new Error('Selected category does not exist');
  }

  const data = {};
  EDITABLE.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const book = await Book.create(data);
  res.status(201).json(await book.populate('category', 'name'));
});

// PUT /api/books/:id (admin) - partial updates allowed (e.g. only { stock })
const updateBook = asyncHandler(async (req, res) => {
  validateBookFields(req.body, res, { partial: true });

  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  if (req.body.category && !(await Category.exists({ _id: req.body.category }))) {
    res.status(400);
    throw new Error('Selected category does not exist');
  }

  EDITABLE.forEach((k) => {
    if (req.body[k] !== undefined) book[k] = req.body[k];
  });
  await book.save();
  res.json(await book.populate('category', 'name'));
});

// DELETE /api/books/:id (admin)
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  await Promise.all([
    Review.deleteMany({ book: book._id }),
    Cart.updateMany({}, { $pull: { items: { book: book._id } } }),
    book.deleteOne(),
  ]);
  res.json({ message: 'Book deleted' });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
