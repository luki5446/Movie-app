require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ Error:', err));

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: String,
  poster: String,
  story: String,
  rating: String,
  category: String,
  downloads: {
    link1: String,
    link2: String,
    link3: String
  }
}, { timestamps: true });

const Movie = mongoose.model('movies_collection', movieSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
  adBanner: String,
  movieAdTimer: { type: Number, default: 5 },
  downloadAdTimer: { type: Number, default: 10 },
  adsEnabled: { type: Boolean, default: true }
});

const Settings = mongoose.model('settings_collection', settingsSchema);

// ========== USER APIs ==========

// Get Movies (Pagination - 12 per page)
app.get('/api/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    
    let query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Movie.countDocuments(query);
    
    res.json({
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        adBanner: '',
        movieAdTimer: 5,
        downloadAdTimer: 10,
        adsEnabled: true
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN APIs ==========

// Add Movie
app.post('/api/admin/movies', async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Movie
app.put('/api/admin/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Movie
app.delete('/api/admin/movies/:id', async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Settings
app.put('/api/admin/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Movie.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
