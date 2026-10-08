// Seeds demo data into the database defined by MONGO_URI.
// WARNING: this DELETES all existing users, categories, books, carts, orders and reviews.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const categoryNames = ['Classics', 'Science Fiction & Fantasy', 'Non-Fiction', 'Self-Help', 'Technology'];

const books = [
  {
    title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Classics', ISBN: '9780743273565', price: 10.99, stock: 25, featured: true,
    description: 'Jazz Age Long Island, a mysterious millionaire and a green light across the bay. Fitzgerald\u2019s compact novel is a sharp look at ambition, wealth and the cost of reinventing yourself.',
  },
  {
    title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classics', ISBN: '9780061120084', price: 12.5, stock: 30, featured: true,
    description: 'Scout Finch grows up in 1930s Alabama while her father defends a Black man falsely accused of a crime. A warm, painful story about courage, empathy and injustice.',
  },
  {
    title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Classics', ISBN: '9780141439518', price: 8.99, stock: 40, featured: false,
    description: 'Elizabeth Bennet and the proud Mr. Darcy misjudge each other in Regency England. Austen\u2019s wit and social comedy make this one of the most loved romances in English.',
  },
  {
    title: 'The Alchemist', author: 'Paulo Coelho', category: 'Classics', ISBN: '9780062315007', price: 14.99, stock: 35, featured: false,
    description: 'A young Andalusian shepherd travels toward the Egyptian pyramids in search of treasure and learns to listen to his heart. A short, fable-like story about following your personal calling.',
  },
  {
    title: '1984', author: 'George Orwell', category: 'Science Fiction & Fantasy', ISBN: '9780451524935', price: 9.99, stock: 50, featured: true,
    description: 'Winston Smith works for the Ministry of Truth in a country watched by Big Brother. Orwell\u2019s dystopia of surveillance, propaganda and rewritten history still feels uncomfortably current.',
  },
  {
    title: 'Dune', author: 'Frank Herbert', category: 'Science Fiction & Fantasy', ISBN: '9780441013593', price: 18.0, stock: 20, featured: true,
    description: 'On the desert planet Arrakis, young Paul Atreides is pulled into a struggle over the universe\u2019s most valuable resource. An epic of politics, ecology and prophecy.',
  },
  {
    title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Science Fiction & Fantasy', ISBN: '9780547928227', price: 13.95, stock: 28, featured: false,
    description: 'Bilbo Baggins, a comfortable homebody, is swept into a quest with thirteen dwarves to reclaim a mountain from a dragon. The adventure that set the stage for The Lord of the Rings.',
  },
  {
    title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', ISBN: '9780062316097', price: 19.99, stock: 22, featured: true,
    description: 'A sweeping history of our species, from early foragers to the scientific and digital revolutions, asking how shared stories and beliefs shaped the modern world.',
  },
  {
    title: 'Educated', author: 'Tara Westover', category: 'Non-Fiction', ISBN: '9780399590504', price: 16.5, stock: 18, featured: false,
    description: 'A memoir of growing up in a survivalist family in rural Idaho with no formal schooling, and of the long road to a university education and a life of her own.',
  },
  {
    title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', ISBN: '9780735211292', price: 17.99, stock: 45, featured: true,
    description: 'A practical guide to building good habits and breaking bad ones through small, consistent changes. Clear explains how tiny improvements compound over time.',
  },
  {
    title: 'Deep Work', author: 'Cal Newport', category: 'Self-Help', ISBN: '9781455586691', price: 16.0, stock: 15, featured: false,
    description: 'Newport argues that the ability to focus without distraction is increasingly rare and valuable, and lays out concrete routines for doing your best thinking.',
  },
  {
    title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', ISBN: '9780132350884', price: 39.99, stock: 12, featured: true,
    description: 'A handbook of agile software craftsmanship covering naming, functions, comments, error handling and refactoring, with worked examples of turning messy code into readable code.',
  },
  {
    title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', category: 'Technology', ISBN: '9780135957059', price: 44.99, stock: 3, featured: false,
    description: 'Timeless advice for working developers on tooling, estimation, testing and taking responsibility for your craft. This 20th anniversary edition is fully updated.',
  },
  
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Book.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // create() (not insertMany) so the password hashing hook runs
  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'Admin123', role: 'admin' });
  const user = await User.create({ name: 'Demo User', email: 'user@example.com', password: 'User123', role: 'user' });

  const categories = await Category.insertMany(categoryNames.map((name) => ({ name })));
  const catId = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const created = await Book.insertMany(
    books.map((b) => ({ ...b, category: catId[b.category], image: cover(b.ISBN) }))
  );

  // A couple of sample reviews so book pages are not empty
  const byTitle = Object.fromEntries(created.map((b) => [b.title, b]));
  await Review.insertMany([
    { user: user._id, book: byTitle['Atomic Habits']._id, rating: 5, comment: 'Practical and easy to apply. I started the two-minute rule the same week.' },
    { user: admin._id, book: byTitle['Atomic Habits']._id, rating: 4, comment: 'Clear writing with good examples. A few chapters repeat earlier ideas.' },
    { user: user._id, book: byTitle['Dune']._id, rating: 5, comment: 'Dense and immersive world-building. Worth the effort.' },
  ]);

  console.log(`Seeded ${categories.length} categories, ${created.length} books, 2 users, 3 reviews.`);
  console.log('Admin: admin@example.com / Admin123');
  console.log('User:  user@example.com / User123');
};

seed()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(`Seeding failed: ${err.message}`);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
