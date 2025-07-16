import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  // port: 587,
  // secure: false,
  auth: {
    user: process.env.HOST_EMAIL,
    pass: process.env.HOST_PASS
  }
});


export const sendingEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"G-CLient" <${process.env.HOST_EMAIL}>`,
      to,
      subject,
      html,
    });
    return info;

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error('Failed to send email');
  }
};



export const registerAdminMailTemplate = `
 <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
  <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
    
    <img src="https://your-logo-link.com/gclient-logo.png" alt="GClient Logo" style="height: 40px; margin-bottom: 20px;" />

    <h1>Hello {{firstName}}</h1>
    
    <p style="font-size: 10px; color: #333;">You registered as an admin</p>
    <p style="font-size: 16px; color: #333;">Your one-time verification code:</p>
    <p style="font-size: 32px; font-weight: bold; color: #003b5c; letter-spacing: 2px; margin: 10px 0;">
      {{verificationToken}}
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      This code expires after 20 minutes.
    </p>
    
    <br>
    <p style="font-size: 14px; color: #888;">— GClient Team</p>
  </div>
</div>
`;


//learner email
export const registerLearnerMailTemplate = `
 <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
  <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
    
    <img src="https://your-logo-link.com/gclient-logo.png" alt="GClient Logo" style="height: 40px; margin-bottom: 20px;" />

    <h3>Hello {{firstName}}</h3>
     <p style="font-size: 10px; color: #333;">You registered as a learner</p>
    <p style="font-size: 16px; color: #333;">Your one-time verification code:</p>
    <p style="font-size: 32px; font-weight: bold; color: #003b5c; letter-spacing: 2px; margin: 10px 0;">
      {{verificationToken}}
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      This code expires after 20 minutes.
    </p>
    
    <br>
    <p style="font-size: 14px; color: #888;">— GClient Team</p>
  </div>
</div>
`;
