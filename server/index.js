const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri =
  process.env.SCRAPPER_MONGO_URI ||
  'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

// Routes
const routes = require('./routes');
const { startSectionScrapeCron } = require('./utils/sectionScrapeCron');
const { startBlogCron } = require('./utils/aiCrons/blogCron');
const { startSchemeCron } = require('./utils/aiCrons/schemeCron');

const { seedAdmin } = require('./controllers/admin');

// Passport setup (Google OAuth)
const passport = require('./utils/passportSetup');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.JWT_SECRET || 'sarkariafsar_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());

// Serve uploaded OG images publicly at /og/ and /uploads/
const path = require('path');
app.use('/og', express.static(path.join(__dirname, 'uploads', 'og')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// API routes (auth is also under /api so reverse proxy forwards it correctly)
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global server error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// MongoDB connection + server start
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    seedAdmin();
    startSectionScrapeCron();
    startBlogCron();
    startSchemeCron();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

  
