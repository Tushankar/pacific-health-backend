/**
 * Seed script — Creates the admin user in the database.
 * Run once: node seeds/admin.seed.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/user.model");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const adminEmail = "pacifichealth@gmail.com";
    const adminPassword = "12345678";

    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log("⚠️  Admin user already exists. Updating role to admin...");
      existing.role = "admin";
      existing.isVerified = true;
      await existing.save();
      console.log("✅ Admin user updated successfully!");
    } else {
      await User.create({
        fullName: "Pacific Health Admin",
        email: adminEmail,
        phoneNumber: "+1 (000) 000-0000",
        password: adminPassword,
        role: "admin",
        isVerified: true,
      });
      console.log("✅ Admin user created successfully!");
    }

    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
