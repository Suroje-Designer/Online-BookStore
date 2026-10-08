const express = require('express');
const {
  getBookReviews,
  createReview,
  deleteReview,
  getAllReviews,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAllReviews);
router.route('/book/:bookId').get(getBookReviews).post(protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
