const User = require("../models/user.model");

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address || "",
        bio: user.bio || "",
        role: user.role,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled || false,
        profilePicture: user.profilePicture || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Update only provided fields
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    // Update localStorage-friendly response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/user/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password.",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long and include an uppercase letter, a number, and a special character.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Toggle 2FA on/off
 * @route   PUT /api/user/toggle-2fa
 * @access  Private
 */
const toggle2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      message: user.twoFactorEnabled
        ? "Two-factor authentication enabled! You will receive an OTP on every login."
        : "Two-factor authentication disabled.",
    });
  } catch (error) {
    console.error("Toggle 2FA Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/user/profile-picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a file." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Save relative path
    const filePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = filePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully!",
      profilePicture: filePath,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
      }
    });
  } catch (error) {
    console.error("Upload Profile Picture Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getProfile, updateProfile, changePassword, toggle2FA, uploadProfilePicture };
