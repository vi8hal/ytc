
import { verifySessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import type { VercelPoolClient } from '@vercel/postgres';

export async function getSessionPayload() {
    const sessionToken = cookies().get('session_token')?.value;
    if (!sessionToken) return null;
    try {
      const payload = await verifySessionToken(sessionToken);
      return payload as { userId: number, email: string, isAdmin: boolean } | null;
    } catch(e) {
      console.error("[SESSION_VERIFICATION_FAILED]", e);
      return null;
    }
}

export async function getUserIdFromSession() {
    const payload = await getSessionPayload();
    return payload?.userId ?? null;
}

export async function sendVerificationEmail(email: string, otp: string, subject: string, body: string) {
  try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: subject,
        html: body,
      };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[EMAIL_SEND_ERROR]', error);
    // This is a critical failure, so we throw to ensure the transaction is rolled back.
    throw new Error('Could not send verification email. Please check server configuration.');
  }
}

/**
 * Generates a 6-digit OTP and saves it to the database for the specified email.
 * IMPORTANT: This function must be called within an active database transaction.
 * @param client The active VercelPoolClient instance from an ongoing transaction.
 * @param email The user's email to associate the OTP with.
 * @returns The generated OTP string.
 */
export async function generateAndSaveOtp(client: VercelPoolClient, email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await client.query('UPDATE users SET otp = $1, "otpExpires" = $2 WHERE email = $3', [otp, otpExpires, email]);
  
  return otp;
}
