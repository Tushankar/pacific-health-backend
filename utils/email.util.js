const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generate a random 5-digit OTP
 */
const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

/**
 * Send OTP email to user
 * @param {string} to - recipient email
 * @param {string} otp - the OTP code
 * @param {string} purpose - "verification" | "password-reset"
 */
const sendOtpEmail = async (to, otp, purpose = "verification") => {
  const subject =
    purpose === "verification"
      ? "Pacific Health – Verify Your Email"
      : "Pacific Health – Password Reset OTP";

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://www.pacifichealthsystems.net/wp-content/themes/pacifichealth/images/logo.png" alt="Pacific Health" style="height: 48px;" />
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">
          ${purpose === "verification" ? "Email Verification" : "Password Reset"}
        </h2>
        <p style="color: #64748b; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
          ${purpose === "verification" ? "Use the code below to verify your email address and complete your registration." : "Use the code below to reset your password."}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 16px 32px; border-radius: 12px; border: 2px dashed #93c5fd;">
            ${otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 16px 0 0;">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
      <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Pacific Health Systems Inc. All rights reserved.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Pacific Health" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOtpEmail };
