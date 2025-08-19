
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import type { VercelPoolClient } from '@vercel/postgres';

export async function getUserIdFromSession() {
    const sessionToken = cookies().get('session_token')?.value;
    if (!sessionToken) return null;
    try {
      const payload = await verifySessionToken(sessionToken);
      return payload?.userId as number | null;
    } catch(e) {
      console.error("Session token verification failed:", e);
      return null;
    }
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
    console.error('Failed to send email:', error);
    throw new Error('Could not send email. Please check server configuration.');
  }
}

export async function generateAndSaveOtp(client: VercelPoolClient, email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await client.query('UPDATE users SET otp = $1, "otpExpires" = $2 WHERE email = $3', [otp, otpExpires, email]);
  
  return otp;
}
