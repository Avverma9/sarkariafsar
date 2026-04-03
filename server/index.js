const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri =
  process.env.SCRAPPER_MONGO_URI ||
  'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

// Routes
const routes = require('./routes'); // agar routes folder same level par hai
const { startSectionScrapeCron } = require('./utils/sectionScrapeCron');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded OG images publicly at /og/ and /uploads/
const path = require('path');
app.use('/og', express.static(path.join(__dirname, 'uploads', 'og')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// API routes
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
    startSectionScrapeCron();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

  
