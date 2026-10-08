require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS: set CLIENT_URL (comma separated) to restrict origins; otherwise any origin is allowed (development).
const origins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((s) => s.trim()) : true;
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ message: 'Online Bookstore API is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_secret_key') {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and set a long random value.');
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`));
  } catch (err) {
    console.error(`Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();

module.exports = app;
