const mongoose = require('mongoose');

// Enum for notification types with expanded categories
const NOTIFICATION_TYPES = [
  // Ride-related notifications
  'RIDE_JOIN',           // Someone wants to join a ride
  'RIDE_CANCEL',         // Ride cancelled or participant removed
  'RIDE_UPDATE',         // Ride details updated
  'RIDE_REQUEST',        // New ride request received
  'RIDE_CONFIRMATION',   // Ride request accepted
  'RIDE_REJECTION',      // Ride request rejected

  // User-related notifications
  'USER_PROFILE_UPDATE', // User profile changed
  'USER_SECURITY_ALERT', // Security-related notification

  // System notifications
  'SYSTEM_MAINTENANCE',  // System maintenance alert
  'SYSTEM_UPDATE'        // System update notification
];

// Enum for notification priorities
const NOTIFICATION_PRIORITIES = [
  'LOW',     // Informational
  'MEDIUM',  // Important
  'HIGH',    // Urgent
  'CRITICAL' // Requires immediate attention
];

const NotificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of notification
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    required: true
  },

  // Associated ride (if applicable)
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: function() {
      // Ride field required for ride-related notifications
      return this.type.startsWith('RIDE_');
    }
  },

  // User who triggered the notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Only require user for certain notification types
      const requiredTypes = [
        'RIDE_JOIN', 
        'RIDE_CANCEL', 
        'RIDE_UPDATE', 
        'RIDE_REQUEST', 
        'RIDE_CONFIRMATION', 
        'RIDE_REJECTION',
        'USER_PROFILE_UPDATE'
      ];
      return requiredTypes.includes(this.type);
    },
    default: null
  },

  // Notification content
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500 // Prevent overly long messages
  },

  // Additional context for the notification
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Notification priority
  priority: {
    type: String,
    enum: NOTIFICATION_PRIORITIES,
    default: 'LOW'
  },

  // Notification status
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'ARCHIVED'],
    default: 'UNREAD',
    index: true
  },

  // Timestamp fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '30d' } // Auto-delete after 30 days
  },

  // Optional expiration time
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  // Add timestamps for createdAt and updatedAt
  timestamps: true,

  // Optimize query performance
  indexes: [
    { recipient: 1, status: 1 },
    { type: 1, status: 1 }
  ]
});

// Pre-save middleware for additional validation
NotificationSchema.pre('save', function(next) {
  // Ensure context is an object if provided
  if (this.context && typeof this.context !== 'object') {
    this.context = { data: this.context };
  }

  // Set expiration for critical notifications
  if (this.priority === 'CRITICAL' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Validate that user is provided for certain notification types
  const userRequiredTypes = [
    'RIDE_JOIN', 
    'RIDE_REQUEST', 
    'RIDE_CONFIRMATION', 
    'RIDE_REJECTION'
  ];

  if (userRequiredTypes.includes(this.type) && !this.user) {
    console.warn(`User is recommended for notification type: ${this.type}`);
  }

  next();
});

// Static method to create a notification
NotificationSchema.statics.createNotification = async function(data) {
  try {
    // Validate required fields
    if (!data.recipient) {
      throw new Error('Recipient is required');
    }

    if (!NOTIFICATION_TYPES.includes(data.type)) {
      throw new Error(`Invalid notification type: ${data.type}`);
    }

    // Create and save notification
    const notification = new this(data);
    return await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Instance method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.status = 'READ';
  return await this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
