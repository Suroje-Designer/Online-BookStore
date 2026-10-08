const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: [1, 'Rating must be 1-5'], max: [5, 'Rating must be 1-5'] },
    comment: { type: String, required: [true, 'Comment is required'], trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// A user can review a given book only once.
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
