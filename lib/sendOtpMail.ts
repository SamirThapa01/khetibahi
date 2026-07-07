import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpMail(email: string, otp: string) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>Hamro Bus Sewa</h2>
        <p>Your One-Time Password (OTP) is:</p>

        <h1 style="letter-spacing:4px; color:#2563eb;">
          ${otp}
        </h1>

        <p>This OTP is valid for 5 minutes.</p>
        <p>Do not share this code with anyone.</p>

        <br />
        <p>Thank you,<br/><strong>khetibahi</strong></p>
      </div>
    `,
  });
}