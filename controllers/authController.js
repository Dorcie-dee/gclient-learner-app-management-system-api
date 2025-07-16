import { adminModel } from "../models/adminModel.js";
import { learnerModel } from "../models/learnerModel.js";
import { sendingEmail, registerAdminMailTemplate, registerLearnerMailTemplate, resetPasswordMailTemplate } from "../utils/mailing.js";
import { registerAdminValidator, verifyAdminValidator, resendVerificationValidator, loginValidator, registerLearnerValidator, forgotPasswordValidator, resetPasswordValidator, updatePasswordValidator, profileUpdateAdminValidator } from "../validators/authValidator.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


//admin signup
export const registerAdmin = async (req, res) => {
  try {
    //validate admin info
    const { error, value } = registerAdminValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //checking if user doesn't exist yet
    const adminExisting = await adminModel.findOne({
      $or: [
        {
          firstName: value.firstName,
          lastName: value.lastName
        },
        { email: value.email }
      ]
    });

    if (adminExisting) {
      return res.status(409).json({ message: 'Admin already exists' })
    }

    //password hash
    const hashingPassword = await bcrypt.hash(value.password, 10);

    //6-digit OTP verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    //OTP to expire in 20 minutes
    const verificationTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000);


    //create new admin record in db
    const incomingAdmin = await adminModel.create({
      ...value,
      password: hashingPassword,
      role: "Admin",
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastLogin: new Date()
    });


    //Generate JWT that expires in 20 minutes
    const token = jwt.sign(
      { id: incomingAdmin._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "20m" }
    );

    //email sending
    try {
      const emailSubject = "Your G-Client Verification Code";
      const emailBody = registerAdminMailTemplate
        .replace('{{firstName}}', value.firstName)
        .replace('{{lastName}}', value.lastName)
        .replace('{{verificationToken}}', verificationToken);

      await sendingEmail(incomingAdmin.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
    }

    // Return response
    return res.status(201).json({
      message: 'Admin created successfully. Check your email for the OTP token.',
      data: incomingAdmin,
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


//learner signup
export const registerLearner = async (req, res) => {
  try {
    //validate learner info
    const { error, value } = registerLearnerValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //checking if user doesn't exist yet
    const learnerExisting = await learnerModel.findOne({
      $or: [
        {
          firstName: value.firstName,
          lastName: value.lastName
        },
        { email: value.email }
      ]
    });

    if (learnerExisting) {
      return res.status(409).json({ message: 'Learner already exists' })
    }

    //password hash
    const hashingPassword = await bcrypt.hash(value.password, 10);

    //6-digit OTP verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    //OTP to expire in 20 minutes
    const verificationTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000);


    //create new admin record in db
    const incomingLearner = await learnerModel.create({
      ...value,
      password: hashingPassword,
      role: "Learner",
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastLogin: new Date()
    });


    //Generate JWT that expires in 20 minutes
    const token = jwt.sign(
      { id: incomingLearner._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "20m" }
    );

    //email sending
    try {
      const emailSubject = "Your G-Client Verification Code";
      const emailBody = registerLearnerMailTemplate
        .replace('{{firstName}}', value.firstName)
        .replace('{{lastName}}', value.lastName)
        .replace('{{verificationToken}}', verificationToken);

      await sendingEmail(incomingLearner.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
    }

    // Return response
    return res.status(201).json({
      message: 'Learner created successfully. Check your email for the OTP token.',
      data: incomingLearner,
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


//admin email signup verification
export const verifyUser = async (req, res) => {
  try {
    // Validate incoming request
    const { error, value } = verifyAdminValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    const { email, verificationToken } = value;

    // Check if user exists. OPTION 1, works with only admins
    // const user = await adminModel.findOne({ email });

    //OPTION 2. picking from my utils/findUserByEmail
    // const { user, role } = await findUserByEmail(email);


    // Attempt to find user in both models. OPTION 3. picks both admins and learners
    let user = await adminModel.findOne({ email });
    let role = 'Admin';

    if (!user) {
      user = await learnerModel.findOne({ email });
      role = 'Learner';
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Check if token matches and is not expired
    const now = Date.now();
    const isTokenExpired = !user.verificationTokenExpiresAt || now > user.verificationTokenExpiresAt.getTime();

    if (user.verificationToken !== verificationToken || isTokenExpired) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    // Update verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    user.lastLogin = new Date();

    await user.save();

    return res.status(200).json({ message: "User verified successfully." });

    //will use it when i wanna go with the findUserByEmail util. OPTION 2
    // return res.status(200).json({ message: `${role} verified successfully.` });


  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


//resend verification token
export const resendVerificationEmail = async (req, res) => {
  try {

    // Validate request body
    const { error, value } = resendVerificationValidator.validate(req.body);

    if (error) {
      return res.status(422).json({ message: error.message });
    }

    // Find user by email
    // const user = await adminModel.findOne({ email: value.email });

    const { email } = value
    //find user by email
    let user = await adminModel.findOne({ email });
    let role = 'Admin';

    if (!user) {
      user = await learnerModel.findOne({ email });
      role = 'Learner';
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Rate-limiting logic: max 3 resends in 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();

    if (user.lastResendAt && now - user.lastResendAt.getTime() < THIRTY_MINUTES) {
      if (user.resendAttempts >= 3) {
        return res.status(429).json({
          message: "You've reached the maximum number of OTP requests. Try again in 30 minutes.",
        });
      }
      user.resendAttempts += 1;
    } else {
      user.resendAttempts = 1;
      user.lastResendAt = new Date();
    }

    // Generate new 6-digit OTP and expiry time
    const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(now + 20 * 60 * 1000); // 20 minutes from now

    user.verificationToken = newVerificationToken;
    user.verificationTokenExpiresAt = newExpiry;

    await user.save();


    // Select email template based on role
    const emailSubject = "Your New GClient Verification Code";

    let emailBody = "";
    if (user.role === "Admin") {
      emailBody = registerAdminMailTemplate
        .replace("{{firstName}}", user.firstName)
        .replace("{{lastName}}", user.lastName)
        .replace("{{verificationToken}}", newVerificationToken);
    } else {
      emailBody = registerLearnerMailTemplate
        .replace("{{firstName}}", user.firstName)
        .replace("{{lastName}}", user.lastName)
        .replace("{{verificationToken}}", newVerificationToken);
    }

    await sendingEmail(user.email, emailSubject, emailBody);

    return res.status(200).json({
      message: "Verification token resent successfully. Please check your email.",
      newVerificationToken
    });

  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


//login
export const loginUser = async (req, res) => {
  try {
    const { error, value } = loginValidator.validate(req.body);

    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //if email exists
    // const user = await adminModel.findOne({ email: value.email });

    const { email } = value
    let user = await adminModel.findOne({ email });
    let role = 'Admin';

    if (!user) {
      user = await learnerModel.findOne({ email });
      role = 'Learner';
    }


    if (!user) {
      return res.status(404).json('User not found')
    };

    //comparing password
    const isAMatch = await bcrypt.compare(value.password, user.password);
    if (!isAMatch) {
      return res.status(401).json('Invalid credentials');
    }

    //generating jwt token
    const token = jwt.sign({
      id: user._id, role: user.role
    },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' });

    res.status(200).json({
      token,
      user: {
        role: user.role,
        email: user.email,
        id: user.id
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


//forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordValidator.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // const user = await adminModel.findOne({ email: value.email });

    const { email } = value;
    let user = await adminModel.findOne({ email });
    let role = 'Admin';

    if (!user) {
      user = await learnerModel.findOne({ email });
      role = 'Learner';
    }


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    //expire after 15 mins
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpires = tokenExpires;
    await user.save();


    const resetURL = `${process.env.BASE_RESET_URL}/${resetToken}`;

    //email sending
    try {
      const emailSubject = "Your G-Client Password Reset Code";
      const emailBody = resetPasswordMailTemplate
        .replace('{{firstName}}', user.firstName)
        .replace('{{lastName}}', user.lastName)
        .replace('{{resetToken}}', resetURL)
        .replace('{{user}}', role);

      await sendingEmail(user.email, emailSubject, emailBody);

      res.status(200).json({
        message: "Reset code sent to email",
        // optional: I need to remove this in production
        resetURL: resetURL
      });
    } catch (resetEmailError) {
      console.error('Error sending reset email code:', resetEmailError.message);
      res.status(500).json({ message: "Failed to send reset email.", error: error.message });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//reset password with only new and confirm password in UI
export const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordValidator.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { token } = req.params;
    const { newPassword } = value;

    // const user = await adminModel.findOne({ resetToken: token });


    let user = await adminModel.findOne({ resetToken: token });
    let role = 'Admin';

    if (!user) {
      user = await learnerModel.findOne({ resetToken: token });
      role = 'Learner';
    }

    if (!user || new Date() > user.resetTokenExpires) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//reset password which includes token input as a placeholder in the UI
// export const resetPassword = async (req, res) => {
//   try {
//     const { error, value } = resetPasswordValidator.validate(req.body);

//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const { token, newPassword } = value;
//     const admin = await adminModel.findOne({ resetToken: token });
//     if (!admin || new Date() > admin.resetTokenExpires) {
//       return res.status(400).json({ message: "Invalid or expired reset token" });
//     }

//     admin.password = await bcrypt.hash(newPassword, 10);
//     admin.resetToken = undefined;
//     admin.resetTokenExpires = undefined;

//     await admin.save();

//     res.status(200).json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: err.message });

//   }
// };


//password update/change
export const updatePassword = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    //validating input
    const { error, value } = updatePasswordValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //extracting validated data
    const { currentPassword, newPassword } = value;

    //updating user password
    const updatedPassword = await adminModel.findById(
      req.auth.id
    );
    //comparing password
    const isTheSame = await bcrypt.compare(currentPassword, updatedPassword.password);

    if (!isTheSame) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    updatedPassword.password = await bcrypt.hash(newPassword, 10);
    await updatedPassword.save();

    res.status(200).json({
      message: "Password updated successfully",
      pass: updatedPassword
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


//getting authenticated user
export const getAuthenticatedUser = async (req, res, next) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }

    // const user = await adminModel.findById(userId).select("-password");

    let user = await adminModel.findById(userId).select("-password");
    let role = "Admin";

    if (!user) {
      user = await learnerModel.findById(userId).select("-password");
      role = "Learner";
    }

    //.select({ password: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
};



//profile updating using put
export const profileUpdate = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Validate incoming request
    const { error, value } = profileUpdateAdminValidator.validate({
      ...req.body,
      profileImage: req.file?.filename
      });
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    // Perform replace operation
    const result = await adminModel.findOneAndReplace(
      { _id: req.params.id },
      value,
      { returnDocument: "after" }
    );

    // If no record is found, return a 404 error
    if (!result) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Return the updated document
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};



