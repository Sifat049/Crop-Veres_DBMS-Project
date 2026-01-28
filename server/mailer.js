import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendAdminSignupCode({ email, name, role, code }) {
  const admin = process.env.ADMIN_EMAIL;
  const subject = `CropVerse Signup Approval Code: ${email}`;
  const text =
`New signup request:
Name: ${name}
Email: ${email}
Role: ${role}

Confirmation Code: ${code}

Use Admin Dashboard to approve this user and share/verify the code.
`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: admin,
    subject,
    text
  });
}

export async function sendUserSignupCode({ email, name, code }) {
  const subject = "CropVerse Verification Code";
  const text =
`Hi ${name},
Your verification code is: ${code}

This code will expire in 10 minutes.
`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,          
    subject,
    text
  });
}
