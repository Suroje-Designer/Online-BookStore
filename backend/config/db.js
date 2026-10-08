const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri === 'your_mongodb_atlas_connection_string') {
    throw new Error(
      'MONGO_URI is not set. Copy backend/.env.example to backend/.env and add your MongoDB Atlas connection string.'
    );
  }
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
