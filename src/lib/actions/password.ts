
'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sendVerificationEmail, generateAndSaveOtp } from '@/lib/utils/auth-helpers';
import { EmailSchema, OTPSchema, PasswordSchema } from '@/lib/schemas';

const ResetPasswordSchema = z.object({
    email: EmailSchema,
    otp: OTPSchema,
    password: PasswordSchema,
});


export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const validation = EmailSchema.safeParse(email);

    if (!validation.success) {
      return { error: true, message: validation.error.flatten().formErrors[0] };
    }
    
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user) {
            const otp = await generateAndSaveOtp(email);
            await sendVerificationEmail(
                email, 
                otp,
                'Your ChronoComment Password Reset Code',
                `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                    <h2>Password Reset Request</h2>
                    <p>Your one-time password reset code is:</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">{{otp}}</p>
                    <p style="color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>`
            );
        }
    } catch(e) {
        console.error("Error in forgot password action:", e);
        // Do not expose internal errors to the client
    }
    // Always return a generic message to prevent user enumeration attacks.
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
    
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return { error: 'Invalid email or OTP.' };
        }

        if (user.otp !== otp || !user.otpExpires || new Date() > new Date(user.otpExpires)) {
            return { error: 'Invalid or expired OTP. Please request a new one.' };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await db.query(
            'UPDATE users SET password = $1, otp = $2, "otpExpires" = $3, verified = $4 WHERE id = $5',
            [hashedPassword, null, null, true, user.id]
        );
        
    } catch (error) {
         if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('An unexpected error occurred during password reset:', error);
        return { error: 'An unexpected server error occurred.' };
    }

    redirect('/signin');
}
