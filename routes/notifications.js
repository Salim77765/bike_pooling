const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user.id 
    })
    .populate('ride', 'from to departureTime')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

module.exports = router;
