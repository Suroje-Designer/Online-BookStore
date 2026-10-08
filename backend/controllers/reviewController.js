const mongoose = require('mongoose');
const Review = require('../models/Review');
const Book = require('../models/Book');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reviews/book/:bookId  (public)
const getBookReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.bookId)) {
    res.status(400);
    throw new Error('Invalid book id');
  }
  const reviews = await Review.find({ book: req.params.bookId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  res.json({ reviews, numReviews: count, averageRating: Math.round(average * 10) / 10 });
});

// POST /api/reviews/book/:bookId  body: { rating, comment }
const createReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  if (!mongoose.isValidObjectId(bookId)) {
    res.status(400);
    throw new Error('Invalid book id');
  }
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be a whole number from 1 to 5');
  }
  if (!comment) {
    res.status(400);
    throw new Error('Please write a short comment');
  }
  if (!(await Book.exists({ _id: bookId }))) {
    res.status(404);
    throw new Error('Book not found');
  }
  if (await Review.exists({ user: req.user._id, book: bookId })) {
    res.status(400);
    throw new Error('You have already reviewed this book');
  }

  const review = await Review.create({ user: req.user._id, book: bookId, rating, comment });
  res.status(201).json(await review.populate('user', 'name'));
});

// DELETE /api/reviews/:id  (owner or admin)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (req.user.role !== 'admin' && String(review.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own reviews');
  }
  await review.deleteOne();
  res.json({ message: 'Review deleted' });
});

// GET /api/reviews (admin) - every review, for moderation
const getAllReviews = asyncHandler(async (req, res) => {
  res.json(
    await Review.find()
      .populate('user', 'name email')
      .populate('book', 'title')
      .sort({ createdAt: -1 })
  );
});

module.exports = { getBookReviews, createReview, deleteReview, getAllReviews };
