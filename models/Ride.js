const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    from: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    to: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    departureTime: {
        type: Date,
        required: true
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 1
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geospatial queries
rideSchema.index({ 'from.coordinates': '2dsphere' });
rideSchema.index({ 'to.coordinates': '2dsphere' });
rideSchema.index({ 'from.coordinates': '2dsphere' });
rideSchema.index({ 'to.coordinates': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
