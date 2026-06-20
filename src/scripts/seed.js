// property-rental-server/scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Property = require("../models/Property");

const seed = async () => {
  await connectDB();
  console.log("Connected to MongoDB. Starting seed...");

  // ============================================
  // 1. ADMIN USER
  // ============================================
  const adminExists = await User.findOne({ email: "admin@renteasy.com" });
  if (!adminExists) {
    await User.create({
      name: "RentEasy Admin",
      email: "admin@renteasy.com",
      password: "Admin123",
      role: "admin",
      photo: "https://i.ibb.co/4pDNDk1/avatar.png",
      isGoogleUser: false,
    });
    console.log("✅ Admin created: admin@renteasy.com / Admin123");
  } else {
    console.log("ℹ️  Admin already exists — skipping");
  }

  // ============================================
  // 2. OWNER USER
  // ============================================
  const ownerExists = await User.findOne({ email: "owner@renteasy.com" });
  let owner = ownerExists;
  if (!ownerExists) {
    owner = await User.create({
      name: "John Owner",
      email: "owner@renteasy.com",
      password: "Owner123",
      role: "owner",
      photo: "https://i.ibb.co/4pDNDk1/avatar.png",
      isGoogleUser: false,
    });
    console.log("✅ Owner created: owner@renteasy.com / Owner123");
  } else {
    console.log("ℹ️  Owner already exists — skipping");
  }

  // ============================================
  // 3. TENANT USER
  // ============================================
  const tenantExists = await User.findOne({ email: "tenant@renteasy.com" });
  if (!tenantExists) {
    await User.create({
      name: "Jane Tenant",
      email: "tenant@renteasy.com",
      password: "Tenant123",
      role: "tenant",
      photo: "https://i.ibb.co/4pDNDk1/avatar.png",
      isGoogleUser: false,
    });
    console.log("✅ Tenant created: tenant@renteasy.com / Tenant123");
  } else {
    console.log("ℹ️  Tenant already exists — skipping");
  }

  // ============================================
  // 4. SAMPLE PROPERTIES
  // ============================================
  const propertyCount = await Property.countDocuments();
  if (propertyCount === 0 && owner) {
    const sampleProperties = [
      {
        ownerId: owner._id,
        title: "Modern Downtown Apartment with City View",
        description:
          "A beautifully furnished apartment in the heart of the city. Features floor-to-ceiling windows with stunning city views, modern kitchen with stainless steel appliances, and high-speed fiber internet. Walking distance to restaurants, shopping, and public transport.",
        location: "Manhattan, New York, NY",
        propertyType: "Apartment",
        price: 3500,
        rentType: "per month",
        bedrooms: 2,
        bathrooms: 2,
        size: 1200,
        amenities: [
          "WiFi",
          "Air Conditioning",
          "Heating",
          "Gym",
          "Security",
          "Elevator",
        ],
        images: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
      {
        ownerId: owner._id,
        title: "Cozy Suburban House with Large Backyard",
        description:
          "A spacious family home in a quiet suburban neighborhood. Features an open-plan living area, large modern kitchen, master bedroom with en-suite, and a beautiful landscaped backyard perfect for entertaining. Excellent school district nearby.",
        location: "Brookline, Massachusetts",
        propertyType: "House",
        price: 4200,
        rentType: "per month",
        bedrooms: 4,
        bathrooms: 3,
        size: 2400,
        amenities: [
          "WiFi",
          "Air Conditioning",
          "Heating",
          "Parking",
          "Garden",
          "Pet Friendly",
          "Laundry",
        ],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
      {
        ownerId: owner._id,
        title: "Luxury Beachfront Villa with Private Pool",
        description:
          "An exquisite beachfront villa offering unparalleled ocean views and direct beach access. Features a private heated pool, chef kitchen, home theater, and four en-suite bedrooms. Perfect for those seeking the ultimate luxury lifestyle.",
        location: "Miami Beach, Florida",
        propertyType: "Villa",
        price: 8500,
        rentType: "per month",
        bedrooms: 4,
        bathrooms: 4,
        size: 4000,
        amenities: [
          "WiFi",
          "Air Conditioning",
          "Swimming Pool",
          "Parking",
          "Security",
          "Furnished",
          "Balcony",
        ],
        images: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
      {
        ownerId: owner._id,
        title: "Downtown Studio with Smart Home Features",
        description:
          "A sleek fully automated studio apartment featuring smart home technology throughout. Includes smart lighting, temperature control, and security system all controlled from your phone. Compact yet efficient layout with premium finishes.",
        location: "Chicago, Illinois",
        propertyType: "Studio",
        price: 1800,
        rentType: "per month",
        bedrooms: 0,
        bathrooms: 1,
        size: 550,
        amenities: [
          "WiFi",
          "Air Conditioning",
          "Heating",
          "Security",
          "Elevator",
          "Furnished",
        ],
        images: [
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
      {
        ownerId: owner._id,
        title: "Uptown Condo with Rooftop Access",
        description:
          "A modern condo in an upscale building offering access to a stunning rooftop terrace with panoramic city views. Features an open kitchen, spa-like bathroom, and dedicated parking. Ideal for young professionals.",
        location: "Seattle, Washington",
        propertyType: "Condo",
        price: 2800,
        rentType: "per month",
        bedrooms: 1,
        bathrooms: 1,
        size: 900,
        amenities: [
          "WiFi",
          "Air Conditioning",
          "Gym",
          "Parking",
          "Security",
          "Elevator",
          "Balcony",
        ],
        images: [
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
      {
        ownerId: owner._id,
        title: "Charming Townhouse in Historic District",
        description:
          "A beautifully restored three-story townhouse in a historic neighborhood. Blends original architectural features with modern updates. Includes a private patio, original hardwood floors, exposed brick walls, and a renovated kitchen.",
        location: "Austin, Texas",
        propertyType: "Townhouse",
        price: 3200,
        rentType: "per month",
        bedrooms: 3,
        bathrooms: 2,
        size: 1800,
        amenities: [
          "WiFi",
          "Heating",
          "Parking",
          "Garden",
          "Laundry",
          "Pet Friendly",
        ],
        images: [
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
          "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
        ],
        status: "approved",
        ownerInfo: {
          name: "John Owner",
          email: "owner@renteasy.com",
          phone: "+1 (555) 123-4567",
        },
      },
    ];

    await Property.insertMany(sampleProperties);
    console.log(`✅ ${sampleProperties.length} sample properties created`);
  } else {
    console.log(`ℹ️  Properties already exist — skipping`);
  }

  // ============================================
  // DONE
  // ============================================
  console.log("\n🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Demo Login Credentials");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin:  admin@renteasy.com  / Admin123");
  console.log("  Owner:  owner@renteasy.com  / Owner123");
  console.log("  Tenant: tenant@renteasy.com / Tenant123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
