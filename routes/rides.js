const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { check, validationResult } = require('express-validator');

// Get all rides
router.get('/', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      // Only return rides with available seats and not full
      availableSeats: { $gt: 0 },
      status: { $ne: 'full' }
    })
    .populate('creator', 'name phone')
    .populate('participants', 'name phone')
    .sort({ departureTime: 1 });
    
    res.json(rides);
  } catch (err) {
    console.error('Server error in fetching rides:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

// Create a ride
router.post('/', auth, async (req, res) => {
  try {
    const newRide = new Ride({
      creator: req.user.id,
      from: req.body.from,
      to: req.body.to,
      departureTime: req.body.departureTime,
      availableSeats: req.body.availableSeats,
      status: 'active'
    });

    const ride = await newRide.save();
    await ride.populate({
      path: 'creator',
      select: 'name email'
    });
    res.json(ride);
  } catch (err) {
    console.error('Server error in creating ride:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

// Join a ride
router.post('/:id/join', auth, async (req, res) => {
  console.log('Join Ride Request Details:', {
    rideId: req.params.id,
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    userPhone: req.user.phone,
    requestBody: req.body,
    requestHeaders: req.headers
  });

  try {
    // Fetch full user details to ensure we have all information
    const user = await User.findById(req.user.id).select('name phone email');
    if (!user) {
      console.error('User not found', { userId: req.user.id });
      return res.status(404).json({ 
        msg: 'User not found', 
        details: 'Unable to locate user in the database' 
      });
    }

    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      console.error('Ride not found', {
        rideId: req.params.id, 
        userId: req.user.id 
      });
      return res.status(404).json({ 
        msg: 'Ride not found', 
        details: 'The specified ride does not exist' 
      });
    }

    // Check available seats before joining
    if (ride.availableSeats <= 0) {
      console.error('No seats available', {
        rideId: req.params.id,
        availableSeats: ride.availableSeats
      });
      return res.status(400).json({ 
        msg: 'No seats available', 
        details: 'This ride is already full' 
      });
    }

    // Comprehensive logging before modification
    console.log('Ride State Before Join:', {
      rideId: ride._id,
      availableSeats: ride.availableSeats,
      participants: ride.participants.length,
      status: ride.status
    });

    // Add participant
    ride.participants.push({ 
      userId: req.user.id,
      name: user.name, 
      phone: user.phone,
      status: 'pending'
    });

    // Decrement available seats
    ride.availableSeats -= 1;

    // Update ride status if no seats left
    if (ride.availableSeats <= 0) {
      ride.status = 'full';
    }

    // Save updated ride
    const savedRide = await ride.save();

    // Log ride state after modification
    console.log('Ride State After Join:', {
      rideId: savedRide._id,
      availableSeats: savedRide.availableSeats,
      participants: savedRide.participants.length,
      status: savedRide.status
    });

    // Respond with updated ride details
    res.json({
      message: 'Ride join request sent successfully',
      ride: savedRide,
      availableSeats: savedRide.availableSeats
    });
  } catch (error) {
    console.error('Server error in join ride:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({ 
      msg: 'Server Error', 
      details: error.message,
      error: true 
    });
  }
});

// Get rides created by the current user
router.get('/created', auth, async (req, res) => {
  try {
    console.log('User ID:', req.user.id); // Debug log
    const rides = await Ride.find({ creator: req.user.id })
      .sort({ departureTime: 1 })
      .populate('creator', ['name', 'email']);
    
    console.log('Fetched rides:', rides); // Debug log
    res.json(rides);
  } catch (err) {
    console.error('Server error in fetching created rides:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

// Accept a ride request
router.post('/:rideId/accept/:participantId', auth, async (req, res) => {
  console.log('Accept Ride Request:', {
    rideId: req.params.rideId,
    participantId: req.params.participantId,
    creatorId: req.user.id,
    fullRequestBody: req.body  // Log full request body for debugging
  });

  try {
    // Validate input parameters
    if (!req.params.rideId || !req.params.participantId) {
      console.error('Invalid input parameters', {
        rideId: req.params.rideId,
        participantId: req.params.participantId
      });
      return res.status(400).json({ 
        msg: 'Invalid parameters',
        details: 'Ride ID and Participant ID are required'
      });
    }

    // Find the ride and verify the creator
    const ride = await Ride.findOne({ _id: req.params.rideId });
    
    if (!ride) {
      console.error('Ride not found', {
        rideId: req.params.rideId,
        userId: req.user.id
      });
      return res.status(404).json({ 
        msg: 'Ride not found',
        details: 'The specified ride does not exist'
      });
    }

    // Additional check to ensure user is the creator
    if (ride.creator.toString() !== req.user.id) {
      console.error('Unauthorized ride modification', {
        rideId: req.params.rideId,
        expectedCreatorId: ride.creator.toString(),
        actualUserId: req.user.id
      });
      return res.status(403).json({ 
        msg: 'Unauthorized',
        details: 'You are not authorized to modify this ride'
      });
    }

    // Log all participants for debugging
    console.log('Ride Participants:', {
      totalParticipants: ride.participants.length,
      participantDetails: ride.participants.map(p => ({
        id: p._id.toString(),
        userId: p.userId,
        name: p.name,
        status: p.status
      }))
    });

    const participantIndex = ride.participants.findIndex(
      p => p._id.toString() === req.params.participantId
    );
    
    if (participantIndex === -1) {
      console.error('Participant not found', {
        rideId: req.params.rideId,
        participantId: req.params.participantId,
        message: 'No matching participant found',
        rideParticipantIds: ride.participants.map(p => p._id.toString())
      });
      return res.status(404).json({ 
        msg: 'Participant not found',
        details: 'The specified participant does not exist in this ride'
      });
    }

    const participant = ride.participants[participantIndex];

    if (participant.status === 'accepted') {
      console.warn('Request already accepted', {
        rideId: req.params.rideId,
        participantId: req.params.participantId
      });
      return res.status(400).json({ 
        msg: 'Request already accepted',
        details: 'This participant has already been accepted'
      });
    }

    const acceptedCount = ride.participants.filter(p => p.status === 'accepted').length;
    if (acceptedCount >= ride.availableSeats) {
      console.error('No seats available', {
        rideId: req.params.rideId,
        acceptedCount,
        availableSeats: ride.availableSeats
      });
      return res.status(400).json({ 
        msg: 'No seats available',
        details: 'All seats for this ride have been filled'
      });
    }

    // Wrap save operation in a transaction or with error handling
    try {
      // Update participant status
      ride.participants[participantIndex].status = 'accepted';
      
      // Decrement available seats
      ride.availableSeats -= 1;

      // If no seats left, update ride status
      if (ride.availableSeats <= 0) {
        ride.status = 'full';
      }

      const savedRide = await ride.save();

      if (!savedRide) {
        throw new Error('Failed to save ride after updating participant');
      }

      // Create notification for participant
      const participantNotification = new Notification({
        recipient: participant.userId,
        type: 'RIDE_CONFIRMATION',
        ride: ride._id,
        ...(req.user.id ? { user: req.user.id } : {}),
        message: `Your ride request has been accepted for ride from ${ride.from} to ${ride.to}`
      });
      
      const savedNotification = await participantNotification.save();

      if (!savedNotification) {
        console.warn('Failed to create notification', {
          participantId: participant.userId,
          rideId: ride._id
        });
      }

      console.log('Ride request accepted successfully', {
        rideId: ride._id,
        participantId: participant.userId,
        participantName: participant.name
      });

      res.json({
        ride: savedRide,
        message: 'Ride request accepted successfully',
        participantId: req.params.participantId
      });
    } catch (saveError) {
      console.error('Error saving ride or notification:', {
        error: saveError.message,
        rideId: ride._id
      });
      return res.status(500).json({ 
        msg: 'Error updating ride', 
        details: saveError.message 
      });
    }
  } catch (err) {
    console.error('Comprehensive Error in Accepting Ride Request:', {
      error: err.message,
      stack: err.stack,
      rideId: req.params.rideId,
      participantId: req.params.participantId,
      userId: req.user.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      errorType: err.name
    });
  }
});

// Reject a ride request
router.post('/:rideId/reject-participant/:participantId', auth, async (req, res) => {
  console.log('Reject Ride Request:', {
    rideId: req.params.rideId,
    participantId: req.params.participantId,
    creatorId: req.user.id,
    fullRequestBody: req.body  // Log full request body for debugging
  });

  try {
    // Validate input parameters
    if (!req.params.rideId || !req.params.participantId) {
      console.error('Invalid input parameters', {
        rideId: req.params.rideId,
        participantId: req.params.participantId
      });
      return res.status(400).json({ 
        msg: 'Invalid parameters',
        details: 'Ride ID and Participant ID are required'
      });
    }

    // Find the ride and verify the creator
    const ride = await Ride.findOne({ _id: req.params.rideId });
    
    if (!ride) {
      console.error('Ride not found', {
        rideId: req.params.rideId,
        userId: req.user.id
      });
      return res.status(404).json({ 
        msg: 'Ride not found',
        details: 'The specified ride does not exist'
      });
    }

    // Additional check to ensure user is the creator
    if (ride.creator.toString() !== req.user.id) {
      console.error('Unauthorized ride modification', {
        rideId: req.params.rideId,
        expectedCreatorId: ride.creator.toString(),
        actualUserId: req.user.id
      });
      return res.status(403).json({ 
        msg: 'Unauthorized',
        details: 'You are not authorized to modify this ride'
      });
    }

    // Log all participants for debugging
    console.log('Ride Participants:', {
      totalParticipants: ride.participants.length,
      participantDetails: ride.participants.map(p => ({
        id: p._id ? p._id.toString() : 'No _id',
        userId: p.userId ? p.userId.toString() : 'No userId',
        name: p.name || 'No name',
        status: p.status || 'No status'
      }))
    });

    // Use mongoose's $pull to remove participant more reliably
    const updatedRide = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        $pull: { 
          participants: { _id: req.params.participantId } 
        } 
      },
      { 
        new: true,  // Return the updated document
        runValidators: true  // Run model validations
      }
    ).populate('participants', 'name email');

    if (!updatedRide) {
      console.error('Failed to update ride', {
        rideId: req.params.rideId,
        participantId: req.params.participantId
      });
      return res.status(500).json({ 
        msg: 'Failed to update ride',
        details: 'Could not remove participant from ride'
      });
    }

    // Find the removed participant to create notification
    const removedParticipant = ride.participants.find(
      p => p._id.toString() === req.params.participantId
    );

    if (removedParticipant) {
      // Create notification for participant
      try {
        const participantNotification = new Notification({
          recipient: removedParticipant.userId,
          type: 'RIDE_CANCEL', 
          ride: ride._id,
          // Optional: only add user if available
          ...(req.user.id ? { user: req.user.id } : {}),
          message: `Your ride request has been rejected for ride from ${ride.from} to ${ride.to}`
        });
        
        await participantNotification.save();
      } catch (notificationError) {
        console.warn('Failed to create notification', {
          error: notificationError.message,
          participantId: removedParticipant.userId,
          rideId: ride._id,
          fullError: notificationError
        });
      }
    }

    console.log('Ride request rejected successfully', {
      rideId: updatedRide._id,
      participantId: req.params.participantId
    });

    res.json({
      ride: updatedRide,
      message: 'Ride request rejected successfully',
      participantId: req.params.participantId
    });
  } catch (err) {
    console.error('Comprehensive Error in Rejecting Ride Request:', {
      error: err.message,
      stack: err.stack,
      rideId: req.params.rideId,
      participantId: req.params.participantId,
      userId: req.user.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      errorType: err.name
    });
  }
});

// Get a single ride by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('participants', 'name email');

    if (!ride) {
      return res.status(404).json({ msg: 'Ride not found' });
    }

    // Optional: Check if the user is authorized to view the ride
    // This could be the creator or a participant, or you might want to keep it open
    // if (ride.creator.toString() !== req.user.id && 
    //     !ride.participants.some(p => p._id.toString() === req.user.id)) {
    //   return res.status(403).json({ msg: 'Not authorized to view this ride' });
    // }

    res.json(ride);
  } catch (err) {
    console.error('Server error in fetching ride:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id,
      rideId: req.params.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

// Update a ride (only creator can update)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Ride Update Request:', {
      rideId: req.params.id,
      userId: req.user.id,
      updateData: req.body
    });

    let ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({ msg: 'Ride not found' });
    }

    // Make sure user is ride creator
    if (ride.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { 
        new: true, 
        runValidators: true // Ensure model validations are run
      }
    ).populate({
      path: 'creator',
      select: 'name email'
    })
     .populate({
       path: 'participants',
       select: 'name email'
     });

    // Notify all participants about the update
    const notifications = ride.participants.map(participant => ({
      recipient: participant._id, // Use participant ID instead of whole object
      type: 'RIDE_UPDATE',
      ride: ride._id,
      user: req.user.id,
      message: `Ride details updated for ${ride.from} to ${ride.to}`
    }));

    try {
      await Notification.insertMany(notifications);
      console.log('Notifications created successfully', {
        rideId: ride._id,
        notificationCount: notifications.length
      });
    } catch (notificationError) {
      console.error('Failed to create notifications:', {
        error: notificationError.message,
        rideId: ride._id
      });
      // Non-critical error, so we'll continue
    }

    res.json(ride);
  } catch (err) {
    console.error('Comprehensive Error in Updating Ride:', {
      error: err.message,
      stack: err.stack,
      rideId: req.params.id,
      userId: req.user.id,
      updateData: req.body,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      errorType: err.name
    });
  }
});

// Delete a ride (only creator can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Make sure user owns the ride
    if (ride.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this ride' });
    }

    await ride.deleteOne();
    res.json({ message: 'Ride removed' });
  } catch (err) {
    console.error('Server error in deleting ride:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id,
      rideId: req.params.id,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

// Coordinate-based ride search with proximity matching
router.post('/search', auth, async (req, res) => {
  try {
    // Validate input coordinates
    if (!req.body.fromCoordinates || !req.body.toCoordinates) {
      return res.status(400).json({ 
        msg: 'Invalid search', 
        details: 'Both source and destination coordinates are required'
      });
    }

    // Extract coordinates directly from request body
    const [fromLongitude, fromLatitude] = req.body.fromCoordinates;
    const [toLongitude, toLatitude] = req.body.toCoordinates;

    // Base query for active rides
    const baseQuery = {
      status: 'active',
      departureTime: { $gt: new Date() },
      availableSeats: { $gt: 0 },
      creator: { $ne: req.user.id }
    };

    // Find rides and populate creator
    const rides = await Ride.find(baseQuery)
      .populate({
        path: 'creator', 
        select: 'name email phone'
      });

    // Proximity matching function (Haversine formula)
    const calculateDistance = (lon1, lat1, lon2, lat2) => {
      const R = 6371; // Radius of the earth in kilometers
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    };

    const deg2rad = (deg) => {
      return deg * (Math.PI/180);
    };

    // Maximum acceptable distance (in kilometers)
    const MAX_DISTANCE = 10; // 10 km radius

    // Filter rides based on coordinate proximity
    const matchedRides = rides.filter(ride => {
      // Check from location proximity
      const fromDistance = calculateDistance(
        fromLongitude, 
        fromLatitude, 
        ride.from.coordinates[0], 
        ride.from.coordinates[1]
      );

      // Check to location proximity
      const toDistance = calculateDistance(
        toLongitude, 
        toLatitude, 
        ride.to.coordinates[0], 
        ride.to.coordinates[1]
      );

      // Log distance for debugging
      console.log('Ride Proximity Check:', {
        rideId: ride._id,
        fromDistance,
        toDistance,
        fromMaxDistance: MAX_DISTANCE,
        toMaxDistance: MAX_DISTANCE
      });

      // Return true if both from and to locations are within max distance
      return fromDistance <= MAX_DISTANCE && toDistance <= MAX_DISTANCE;
    });

    // Sort matched rides by departure time
    const sortedRides = matchedRides.sort((a, b) => 
      new Date(a.departureTime) - new Date(b.departureTime)
    );

    // Comprehensive logging
    console.log('Coordinate Search Diagnostic:', {
      searchCoordinates: {
        from: req.body.fromCoordinates,
        to: req.body.toCoordinates
      },
      totalActiveRides: rides.length,
      matchedRidesCount: sortedRides.length,
      matchedRides: sortedRides.map(ride => ({
        id: ride._id,
        fromCoordinates: ride.from.coordinates,
        toCoordinates: ride.to.coordinates,
        creator: ride.creator?.name || 'Unknown'
      }))
    });

    // Transform rides for response
    const transformedRides = sortedRides.map(ride => ({
      ...ride.toObject(),
      creator: {
        name: ride.creator?.name || 'Unknown',
        email: ride.creator?.email || '',
        phone: ride.creator?.phone || ''
      }
    }));

    res.json(transformedRides);

  } catch (err) {
    console.error('Coordinate Search Error:', {
      error: err.message,
      stack: err.stack,
      searchParams: req.body,
      errorName: err.name,
      errorCode: err.code,
      validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : null
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        details: Object.values(err.errors).map(e => e.message).join(', '),
        error: true 
      });
    }

    res.status(500).json({ 
      msg: 'Server Error', 
      details: err.message,
      error: true 
    });
  }
});

module.exports = router;
