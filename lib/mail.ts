import { Resend } from "resend";

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/new-verification?token=${token}`;

  // Always log for debugging/development
  console.log("----------------------------------------------");
  console.log(`📧 Sending verification email to: ${email}`);
  console.log(`🔗 Link: ${confirmLink}`);
  console.log("----------------------------------------------");

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email not sent via provider.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "PvP One <onboarding@resend.dev>", // Change this to your verified domain in production
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>`,
    });
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  console.log("----------------------------------------------");
  console.log(`📧 Sending password reset email to: ${email}`);
  console.log(`🔗 Link: ${resetLink}`);
  console.log("----------------------------------------------");

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email not sent via provider.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "PvP One <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
    console.log("✅ Email sent via Resend");
  } catch (error) {
    console.error("❌ Failed to send email via Resend:", error);
  }
};
