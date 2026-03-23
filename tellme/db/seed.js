const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.MONGO_URL || 'mongodb://db:27017';
const dbName = process.env.MONGO_DB || 'pick-for-me';
const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const authSource = process.env.MONGO_AUTH_SOURCE;

const buildMongoUrl = () => {
  if (user && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const auth = `${encodedUser}:${encodedPassword}@`;
    const authDb = authSource ? `?authSource=${encodeURIComponent(authSource)}` : '';
    const base = url.replace('mongodb://', `mongodb://${auth}`);
    return `${base}/${dbName}${authDb}`;
  }
  return `${url}/${dbName}`;
};

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    posterUrl: { type: String, default: '' }
  },
  { collection: 'movies' }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'users' }
);

const friendSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    friendId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'friends' }
);

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'logs' }
);

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Friend = mongoose.model('Friend', friendSchema);
const Log = mongoose.model('Log', logSchema);

const loadMovies = () => {
  const dataPath = path.join(__dirname, 'data', 'movies.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
};

const run = async () => {
  await mongoose.connect(buildMongoUrl());

  // OPTION B LOGIC — skip if DB already seeded
  const existingUserCount = await User.countDocuments();
  if (existingUserCount > 0) {
    console.log(`Seed skipped — DB already has ${existingUserCount} users`);
    await mongoose.disconnect();
    return;
  }

  console.log("Seeding DB...");

  // Load movies
  const movies = loadMovies();

  // Clear collections just to be safe (clean start)
  await Promise.all([
    Movie.deleteMany({}),
    User.deleteMany({}),
    Friend.deleteMany({}),
    Log.deleteMany({})
  ]);

  const movieDocs = await Movie.insertMany(movies);
  const movieByTitle = new Map(movieDocs.map((m) => [m.title, m]));

  const passwordHash = await bcrypt.hash('demo123', 10);
  const friendHash = await bcrypt.hash('friend123', 10);

  const demo = await User.create({ username: 'demo', email: 'demo@example.com', passwordHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=demo' });
  const maya = await User.create({ username: 'maya', email: 'maya@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=maya' });
  const jules = await User.create({ username: 'jules', email: 'jules@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=jules' });
  const ravi = await User.create({ username: 'ravi', email: 'ravi@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ravi' });
  const alex = await User.create({ username: 'alex', email: 'alex@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=alex' });
  const nina = await User.create({ username: 'nina', email: 'nina@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=nina' });
  const omar = await User.create({ username: 'omar', email: 'omar@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=omar' });
  const lina = await User.create({ username: 'lina', email: 'lina@example.com', passwordHash: friendHash, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=lina' });

  await Friend.insertMany([
    { userId: demo._id, friendId: maya._id },
    { userId: demo._id, friendId: jules._id },
    { userId: demo._id, friendId: ravi._id },
    { userId: demo._id, friendId: alex._id }
  ]);

  await Log.insertMany([
    { userId: demo._id, movieId: movieByTitle.get('Inception')._id, rating: 4.5 },
    { userId: demo._id, movieId: movieByTitle.get('Her')._id, rating: 4.0 },
    { userId: maya._id, movieId: movieByTitle.get('La La Land')._id, rating: 4.5 },
    { userId: maya._id, movieId: movieByTitle.get('Parasite')._id, rating: 4.0 },
    { userId: maya._id, movieId: movieByTitle.get('Get Out')._id, rating: 4.0 },
    { userId: jules._id, movieId: movieByTitle.get('Dune')._id, rating: 4.0 },
    { userId: jules._id, movieId: movieByTitle.get('Interstellar')._id, rating: 4.5 },
    { userId: ravi._id, movieId: movieByTitle.get('Arrival')._id, rating: 5.0 },
    { userId: ravi._id, movieId: movieByTitle.get('Blade Runner 2049')._id, rating: 4.5 },
    { userId: ravi._id, movieId: movieByTitle.get('The Matrix')._id, rating: 5.0 },
    { userId: ravi._id, movieId: movieByTitle.get('The Dark Knight')._id, rating: 4.5 },
    { userId: alex._id, movieId: movieByTitle.get('Inception')._id, rating: 4.0 },
    { userId: nina._id, movieId: movieByTitle.get('Whiplash')._id, rating: 4.5 },
    { userId: omar._id, movieId: movieByTitle.get('Mad Max: Fury Road')._id, rating: 4.0 },
    { userId: lina._id, movieId: movieByTitle.get('Her')._id, rating: 4.0 }
  ]);

  console.log(`Seeded ${movies.length} movies, 8 users, 4 friendships, 15 logs`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
