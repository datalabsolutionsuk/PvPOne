
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/new-verification?token=${token}`;

  console.log("----------------------------------------------");
  console.log(`📧 Sending verification email to: ${email}`);
  console.log(`🔗 Link: ${confirmLink}`);
  console.log("----------------------------------------------");

  // TODO: Integrate with a real email provider like Resend, SendGrid, etc.
  // await resend.emails.send({ ... })
};
