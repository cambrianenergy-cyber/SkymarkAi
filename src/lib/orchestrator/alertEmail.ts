import nodemailer from "nodemailer";

const FOUNDER_EMAIL = "Cambrianenergy@gmail.com";

export async function sendOrchestratorAlert(subject: string, message: string) {
  // Configure your SMTP transport (use environment variables in production)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || FOUNDER_EMAIL,
    to: FOUNDER_EMAIL,
    subject,
    text: message,
  });
}
