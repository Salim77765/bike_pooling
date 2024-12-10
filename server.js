require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Connect Database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Init Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));

const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
