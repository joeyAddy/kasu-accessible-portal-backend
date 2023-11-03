const express = require("express");
const cors = require("cors"); // Import the cors middleware
const {
  signUp,
  signin,
  getAllUser,
  restrictTo,
  protect,
} = require("./../controller/authController");

const router = express.Router();

// Add cors middleware to allow requests from any client URL
router.use(cors());

router.post("/signup", signUp);
router.post("/signin", signin);

// Protect all routes after this (Only-Admin) middleware
router.use(protect);
router.use(restrictTo("admin"));
router.route("/").get(getAllUser);

module.exports = router;
