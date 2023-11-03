const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../util/catchAsync");
const AppError = require("./../util/appError");
const sendEmail = require("./../util/email");
const User = require("./../model/userModel");

// Make JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const myToken = createToken(user._id);
  res.status(statusCode).json({
    status: "ok",
    token: myToken,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const createUser = await User.create({
    email: req.body.email,
    fullName: req.body.fullName,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    phone: req.body.phone,
    programme: req.body.programme,
    matricNo: req.body.matricNo,
    imageUrl: req.body.imageUrl,
  });

  const message = `<!DOCTYPE html>
  <html>
  <head>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
          }
          .header {
              background-color: #fff; /* Green color */
              color: #ffffff;
              padding: 20px;
              text-align: center;
          }
          .logo {
              width: 100px;
              height: auto;
          }
          .content {
              background-color: #ffffff;
              padding: 20px;
          }
          .message {
              font-size: 18px;
          }
          .school-name {
              color: #2E8B57; 
              font-weight: bold;
          }
          .login-details {
              font-weight: bold;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="https://kasu.edu.ng/wp-content/uploads/2023/02/kasulogo1.png" alt="Kaduna State University Logo" class="logo">
              <h1>Welcome to <span class="school-name">Kaduna State University</span></h1>
          </div>
          <div class="content">
              <p class="message">Hello ${createUser.fullName},</p>
              <p class="message">We're thrilled to welcome you to Kaduna State University's portal. Your account has been successfully created, and here are your login details:</p>
              <p class="login-details">Matric Number: ${createUser.matricNo}</p>
              <p class="login-details">Password: ${req.body.password}</p>
              <p class="message">You can now use these credentials to access the portal and explore all the resources and services we offer. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p class="message">Thank you for choosing Kaduna State University!</p>
          </div>
      </div>
  </body>
  </html>
  `;

  try {
    // Email data pass to email.js
    await sendEmail({
      email: createUser.email,
      subject: "Sign-Up Notification",
      message: message,
    });

    // response data
    createUser.password = undefined; // hide pass from response
    createSendToken(createUser, 201, res);
  } catch (error) {
    return next(new AppError("Somthing problem here!!!", 500));
  }
});

exports.signin = catchAsync(async (req, res, next) => {
  let user = null;
  let matricNo = String(req.body.matricNo).toLowerCase();
  let password = req.body.password;
  // Check matricNo and password exist
  if (!matricNo && !password) {
    return next(new AppError("provide correct login details", 400));
  }

  // Check if user exists & password is correct
  user = await User.findOne({ matricNo }).select("+password");
  if (!user || !(await user.comparePassword(password, user.password))) {
    res.json({
      data: { message: "Invalid matricNo or password", status: 401 },
    });
    return next(new AppError("Incorrect matricNo or password", 401));
  }

  const message = `<!DOCTYPE html>
  <html>
  <head>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
          }
          .header {
              background-color: #fff; 
              color: #ffffff;
              padding: 20px;
              text-align: center;
          }
          .logo {
              width: 100px;
              height: auto;
          }
          .content {
              background-color: #ffffff;
              padding: 20px;
          }
          .message {
              font-size: 18px;
          }
          .school-name {
              color: #2E8B57; /* Green color */
              font-weight: bold;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="https://kasu.edu.ng/wp-content/uploads/2023/02/kasulogo1.png" alt="Kaduna State University Logo" class="logo">
              <h1>Welcome to <span class="school-name">Kaduna State University</span></h1>
          </div>
          <div class="content">
              <p class="message">Hello ${user.fullName},</p>
              <p class="message">You have successfully signed in to your account at Kaduna State University's portal. We're excited to have you on board!</p>
              <p class="message">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p class="message">Thank you for choosing Kaduna State University!</p>
          </div>
      </div>
  </body>
  </html>
  `;

  try {
    if (user === null) return;
    // Email data pass to email.js
    await sendEmail({
      email: user.email,
      subject: "LogIn Notification",
      message: message,
    });

    // response data
    user.password = undefined; // hide pass from response
    createSendToken(user, 200, res);
  } catch (error) {
    return next(new AppError("Somthing problem here!!!", 500));
  }
});

exports.getAllUser = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: "ok",
    length: users.length,
    data: {
      users,
    },
  });
});

// Restrict user route
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

// Get current user Info from JWT token
exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and check of it's there
  let token,
    reqHeader = req.headers.authorization;

  if (reqHeader && reqHeader.startsWith("Bearer")) {
    token = reqHeader.split(" ")[1];
  }
  console.log(token);
  if (!token) {
    next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );
  }

  // Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }
  // assign current user data on (req.user)
  req.user = currentUser;
  next();
});
