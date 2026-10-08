const mongoose = require('mongoose');
const Category = require('../models/Category');
const Book = require('../models/Book');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/categories  (each category includes how many books it holds)
const getCategories = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c, bookCount: countMap.get(String(c._id)) || 0 })));
});

// POST /api/categories (admin)
const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }
  const exists = await Category.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (exists) {
    res.status(400);
    throw new Error('A category with this name already exists');
  }
  const category = await Category.create({ name });
  res.status(201).json(category);
});

// PUT /api/categories/:id (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const clash = await Category.findOne({
    _id: { $ne: category._id },
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (clash) {
    res.status(400);
    throw new Error('A category with this name already exists');
  }
  category.name = name;
  await category.save();
  res.json(category);
});

// DELETE /api/categories/:id (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid category id');
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const inUse = await Book.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${inUse} book(s) still use this category. Move or delete them first.`);
  }
  await category.deleteOne();
  res.json({ message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
