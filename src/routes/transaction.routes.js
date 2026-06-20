// src/routes/transaction.routes.js
const express = require("express");
const router = express.Router();
const {
  getAllTransactions,
  getOwnerTransactions,
} = require("../controllers/transaction.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

router.get("/", authorize("admin"), getAllTransactions);
router.get("/owner", authorize("owner"), getOwnerTransactions);

module.exports = router;