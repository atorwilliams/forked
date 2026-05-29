import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  const base = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${base}/verify-email?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set. Verification link:", link);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Forked <onboarding@resend.dev>",
    to,
    subject: "Verify your email",
    html: `
      <p>Hey, thanks for signing up for Forked.</p>
      <p><a href="${link}">Click here to verify your email</a></p>
      <p>This link expires in 24 hours.</p>
      <p style="color:#888;font-size:12px">If you didn't sign up, you can ignore this.</p>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
  } else {
    console.log("[email] Sent:", data?.id);
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const base = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set. Reset link:", link);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Forked <onboarding@resend.dev>",
    to,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your Forked password.</p>
      <p><a href="${link}">Click here to set a new password</a></p>
      <p>This link expires in 1 hour. If you didn't request a reset, you can ignore this.</p>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
  } else {
    console.log("[email] Sent:", data?.id);
  }
}
