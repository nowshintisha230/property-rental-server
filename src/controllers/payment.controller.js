// src/controllers/payment.controller.js
const stripe = require("../config/stripe");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");

// @route   POST /api/payments/create-intent
// @access  Tenant
const createPaymentIntent = catchAsync(async (req, res, next) => {
  const { propertyId, amount } = req.body;

  if (!propertyId || !amount) {
    return next(new ApiError(400, "Property ID and amount are required"));
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  if (property.status !== "approved") {
    return next(new ApiError(400, "Property is not available for booking"));
  }

  // Amount must be in cents for Stripe
  const amountInCents = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      propertyId: propertyId.toString(),
      tenantId: req.user._id.toString(),
      propertyTitle: property.title,
      tenantEmail: req.user.email,
    },
    description: `Booking for: ${property.title}`,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      "Payment intent created"
    )
  );
});

// @route   POST /api/payments/confirm
// @access  Tenant
const confirmPayment = catchAsync(async (req, res, next) => {
  const {
    paymentIntentId,
    propertyId,
    moveInDate,
    contactNumber,
    additionalNotes,
    amount,
  } = req.body;

  // Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return next(
      new ApiError(400, `Payment not successful. Status: ${paymentIntent.status}`)
    );
  }

  // Check if already processed
  const existingPayment = await Payment.findOne({
    stripePaymentIntentId: paymentIntentId,
  });
  if (existingPayment) {
    return next(new ApiError(400, "Payment already processed"));
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  // Create booking
  const booking = await Booking.create({
    propertyId,
    tenantId: req.user._id,
    ownerId: property.ownerId,
    moveInDate,
    contactNumber,
    additionalNotes: additionalNotes || "",
    amount,
    status: "pending",
    paymentStatus: "paid",
    propertySnapshot: {
      title: property.title,
      location: property.location,
      propertyType: property.propertyType,
      image: property.images[0],
    },
    tenantSnapshot: {
      name: req.user.name,
      email: req.user.email,
      photo: req.user.photo,
    },
  });

  // Save payment record
  const payment = await Payment.create({
    bookingId: booking._id,
    tenantId: req.user._id,
    propertyId,
    stripePaymentIntentId: paymentIntentId,
    stripeClientSecret: paymentIntent.client_secret,
    amount,
    currency: paymentIntent.currency.toUpperCase(),
    status: "succeeded",
    stripeChargeId: paymentIntent.latest_charge || null,
  });

  // Save transaction record
  const transaction = await Transaction.create({
    transactionId: `TXN-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
    paymentId: payment._id,
    bookingId: booking._id,
    propertyId,
    tenantId: req.user._id,
    ownerId: property.ownerId,
    amount,
    currency: paymentIntent.currency.toUpperCase(),
    propertySnapshot: {
      title: property.title,
      location: property.location,
      propertyType: property.propertyType,
    },
    tenantSnapshot: {
      name: req.user.name,
      email: req.user.email,
    },
    ownerSnapshot: {
      name: property.ownerInfo.name,
      email: property.ownerInfo.email,
    },
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { booking, payment, transaction },
      "Payment confirmed and booking created"
    )
  );
});

// @route   POST /api/payments/webhook
// @access  Stripe (raw body)
const stripeWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return next(new ApiError(400, `Webhook signature verification failed: ${err.message}`));
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: "succeeded", stripeChargeId: pi.latest_charge }
      );
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: "failed" }
      );
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      await Payment.findOneAndUpdate(
        { stripeChargeId: charge.id },
        { status: "refunded" }
      );
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

module.exports = { createPaymentIntent, confirmPayment, stripeWebhook };