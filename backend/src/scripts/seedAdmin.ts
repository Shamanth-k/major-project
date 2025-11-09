import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/aetherium-guard";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || "admin@aetherium.io";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      level: 99,
      badges: ["Administrator", "Founder"],
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    await admin.save();

    console.log("✅ Admin user created successfully");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
