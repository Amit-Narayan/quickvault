require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Replace this string with your MongoDB Atlas connection string, or put it in a .env file
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickvault';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Database Models ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const noteSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// --- API Routes ---

// 1. Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'Registration successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid username or password' });

    res.json({ message: 'Login successful', username: user.username });

  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 3. Get User's Notes
app.get('/api/notes/:username', async (req, res) => {
  try {
    const notes = await Note.find({ username: req.params.username }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch notes' });
  }
});

// 4. Add a New Note
app.post('/api/notes', async (req, res) => {
  try {
    const { username, text } = req.body;
    const newNote = new Note({ username, text });
    await newNote.save();
    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: 'Could not save note' });
  }
});

// 5. Delete a Note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete note' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));