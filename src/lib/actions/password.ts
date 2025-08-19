
'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getClient } from '@/lib/db';
import { sendVerificationEmail, generateAndSaveOtp } from '@/lib/utils/auth-helpers';
import { EmailSchema, OTPSchema, PasswordSchema } from '@/lib/schemas';
import { type VercelPoolClient } from '@vercel/postgres';

const ResetPasswordSchema = z.object({
    email: EmailSchema,
    otp: OTPSchema,
    password: PasswordSchema,
});


export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const validation = EmailSchema.safeParse(email);

    if (!validation.success) {
      return { error: true, message: 'Please enter a valid email address.' };
    }
    
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email]);
        const user = result.rows[0];

        // We only proceed if a user is found, but we don't tell the client whether one was found or not.
        if (user) {
            const otp = await generateAndSaveOtp(client, email);
            await sendVerificationEmail(
                email, 
                otp,
                'Your ChronoComment Password Reset Code',
                `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                    <h2>Password Reset Request</h2>
                    <p>Your one-time password reset code is:</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                    <p style="color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>`
            );
        }
        await client.query('COMMIT');
    } catch(e) {
        await client.query('ROLLBACK');
        console.error("Error in forgot password action:", e);
        // Do not expose internal errors to the client.
    } finally {
        client.release();
    }
    // Always return a generic success message to prevent user enumeration attacks.
    return { error: null, message: 'If an account with that email exists, a reset code has been sent.' };
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validation = ResetPasswordSchema.safeParse(rawData);

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).flat()[0] || 'Invalid input.';
        return { error: errorMessage };
    }

    const { email, otp, password } = validation.data;
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const result = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email]);
        const user = result.rows[0];

        if (!user || user.otp !== otp) {
            await client.query('ROLLBACK');
            return { error: 'Invalid email or OTP.' };
        }

        if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
            await client.query('ROLLBACK');
            return { error: 'Invalid or expired OTP. Please request a new one.' };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await client.query(
            'UPDATE users SET password = $1, otp = NULL, "otpExpires" = NULL, verified = TRUE WHERE id = $2',
            [hashedPassword, user.id]
        );
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('An unexpected error occurred during password reset:', error);
        return { error: 'An unexpected server error occurred.' };
    } finally {
        client.release();
    }

    redirect('/signin');
}
