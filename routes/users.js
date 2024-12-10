const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const User = require('../models/User');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename if req.user is not available
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Please add name').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/users/:id
// @desc    Get user details by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Received user ID request:', req.params.id);
    
    // Find user by ID, exclude sensitive information
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', req.params.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    console.log('User details found:', user);
    res.json(user);
  } catch (err) {
    console.error('Error fetching user details:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, college, department } = req.body;

    // Find the user by ID
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (college) user.college = college;
    if (department) user.department = department;

    // Save updated user
    await user.save();

    // Remove sensitive information before sending
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      college: user.college,
      department: user.department,
      profilePicture: user.profilePicture
    };

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Upload profile picture
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const profilePicture = req.file.filename;
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { profilePicture }, 
      { new: true }
    ).select('-password');

    res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
