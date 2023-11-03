let mongoose = require("mongoose");
let bcrypt = require("bcryptjs");

let userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "please provide your email"],
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "please provide your password"],
    minlength: 3,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: true,
    validator: function (value) {
      // 'this' refers to the current document being validated
      return value === this.password;
    },
    message: "Passwords do not match",
  },
  phone: {
    type: String,
    required: [true, "please provide your phone number"],
  },
  imageUrl: {
    type: String,
  },
  fullName: {
    type: String,
    required: [true, "please provide your full name"],
  },
  programme: {
    type: String,
    required: [true, "please provide your programme"],
  },
  matricNo: {
    type: String,
    lowercase: true,
    unique: true,
  },
});

/*****Document middleware*****/
// get User from email
// userSchema.pre("save", function (next) {
//   this.name = this.email.match(/^([^@]*)@/)[1];
//   next();
// });

// hash passsword

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

let User = mongoose.model("User", userSchema);

module.exports = User;
