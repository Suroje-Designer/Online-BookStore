const Book = require('../models/Book');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/stats (admin)
const getStats = asyncHandler(async (req, res) => {
  const [totalBooks, totalCategories, totalOrders, totalUsers, totalReviews, pendingOrders, lowStock, revenueAgg] =
    await Promise.all([
      Book.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Book.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

  res.json({
    totalBooks,
    totalCategories,
    totalOrders,
    totalUsers,
    totalReviews,
    pendingOrders,
    lowStock,
    revenue: revenueAgg.length ? Math.round(revenueAgg[0].total * 100) / 100 : 0,
  });
});

module.exports = { getStats };
