// src/controllers/transaction.controller.js
const Transaction = require("../models/Transaction");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   GET /api/transactions
// @access  Admin
const getAllTransactions = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { search } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: "i" } },
      { "tenantSnapshot.name": { $regex: search, $options: "i" } },
      { "tenantSnapshot.email": { $regex: search, $options: "i" } },
      { "propertySnapshot.title": { $regex: search, $options: "i" } },
    ];
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate("tenantId", "name email photo")
      .populate("ownerId", "name email")
      .populate("propertyId", "title location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Transactions fetched successfully"
    )
  );
});

// @route   GET /api/transactions/owner
// @access  Owner
const getOwnerTransactions = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ ownerId: req.user._id })
      .populate("tenantId", "name email photo")
      .populate("propertyId", "title location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments({ ownerId: req.user._id }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Owner transactions fetched"
    )
  );
});

module.exports = { getAllTransactions, getOwnerTransactions };