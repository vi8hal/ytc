'use server';

import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in the environment variables.');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// --- Password Hashing ---
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}


// --- JWT Token Management ---
export async function createSessionToken(payload: object) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function createVerificationToken(payload: object) {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m') // Shorter expiry for verification
      .sign(secretKey);
}

export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jose.jwtVerify(token, secretKey, { algorithms: ['HS256'] });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function verifyVerificationToken(token: string) {
    const { payload } = await jose.jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    return payload;
}


// --- Email Sending ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: (process.env.EMAIL_SERVER_PORT || '587') === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string, purpose: 'Verification' | 'Password Reset' = 'Verification') {
    const subject = `Your ${purpose} Code`;
    const html = `<p>Your ${purpose.toLowerCase()} code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`;

    await transporter.sendMail({
        from: `ChronoComment <${process.env.EMAIL_FROM}>`,
        to: to,
        subject: subject,
        html: html,
    });
}
