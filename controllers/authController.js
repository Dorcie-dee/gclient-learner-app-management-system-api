import { adminModel } from "../models/admin.js";
import { sendingEmail, registerAdminMailTemplate, registerLearnerMailTemplate } from "../utils/mailing.js";
import { registerAdminValidator, verifyAdminValidator, resendVerificationValidator, loginValidator, registerLearnerValidator } from "../validators/authValidator.js";
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
    //validate admin info
    const { error, value } = registerLearnerValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //checking if user doesn't exist yet
    const learnerExisting = await adminModel.findOne({
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
    const incomingLearner = await adminModel.create({
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
export const verifyAdmin = async (req, res) => {
  try {
    // Validate incoming request
    const { error, value } = verifyAdminValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    const { email, verificationToken } = value;

    // Check if admin exists
    const admin = await adminModel.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // If already verified
    if (admin.isVerified) {
      return res.status(400).json({ message: "Admin is already verified." });
    }

    // Check if token matches and is not expired
    const now = Date.now();
    const isTokenExpired = !admin.verificationTokenExpiresAt || now > admin.verificationTokenExpiresAt.getTime();

    if (admin.verificationToken !== verificationToken || isTokenExpired) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    // Update verification status
    admin.isVerified = true;
    admin.verificationToken = undefined;
    admin.verificationTokenExpiresAt = undefined;
    admin.lastLogin = new Date();

    await admin.save();

    return res.status(200).json({ message: "Admin verified successfully." });

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

    // Find admin by email
    const admin = await adminModel.findOne({ email: value.email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    if (admin.isVerified) {
      return res.status(400).json({ message: "Admin is already verified." });
    }

    // Rate-limiting logic: max 3 resends in 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();

    if (admin.lastResendAt && now - admin.lastResendAt.getTime() < THIRTY_MINUTES) {
      if (admin.resendAttempts >= 3) {
        return res.status(429).json({
          message: "You've reached the maximum number of OTP requests. Try again in 30 minutes.",
        });
      }
      admin.resendAttempts += 1;
    } else {
      admin.resendAttempts = 1;
      admin.lastResendAt = new Date();
    }

    // Generate new 6-digit OTP and expiry time
    const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(now + 20 * 60 * 1000); // 20 minutes from now

    admin.verificationToken = newVerificationToken;
    admin.verificationTokenExpiresAt = newExpiry;

    await admin.save();

    // Send the email
    const emailSubject = "Your New G-Client Verification Code";
    const emailBody = registerUserMailTemplate
      .replace('{{firstName}}', admin.firstName)
      .replace('{{verificationToken}}', newVerificationToken);

    await sendingEmail(admin.email, emailSubject, emailBody);

    return res.status(200).json({
      message: "Verification token resent successfully. Please check your email.",
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
export const loginAll = async (req, res) => {
  try {
    const { error, value } = loginValidator.validate(req.body);

    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //if email exists
    const user = await adminModel.findOne({ email: value.email });
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

    res.status(200).json({token,
      user: {
        role: user.role,
        email: user.email,
        id: user.id
      }
    });

  } catch (error) {
    res.status(500).json('Error logging in');
  }
}