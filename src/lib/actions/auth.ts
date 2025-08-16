
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '@/lib/db';
import { createSessionToken, createVerificationToken, verifyVerificationToken } from '@/lib/auth';
import { sendVerificationEmail, generateAndSaveOtp } from '@/lib/utils/auth-helpers';
import { EmailSchema, NameSchema, OTPSchema, PasswordSchema } from '@/lib/schemas';

const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
});

const SignUpSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});


export async function signUpAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validation = SignUpSchema.safeParse(rawData);

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).flat()[0] || 'Invalid input.';
        return { error: errorMessage };
    }
    
    const { name, email, password } = validation.data;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');
        
        const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUserResult.rowCount > 0) {
            await client.query('ROLLBACK');
            return { error: 'An account with this email already exists.' };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const newUserResult = await client.query(
            'INSERT INTO users (name, email, password, verified, otp, "otpExpires") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, email, hashedPassword, false, otp, otpExpires]
        );
        const newUserId = newUserResult.rows[0].id;
        
        await client.query(
            'INSERT INTO user_settings ("userId") VALUES ($1)',
            [newUserId]
        );
        
        await sendVerificationEmail(
            email, 
            otp,
            'Your ChronoComment Verification Code',
            `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <h2>Welcome to ChronoComment!</h2>
                <p>Your one-time verification code is:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">{{otp}}</p>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>`
        );
        
        const verificationToken = await createVerificationToken({ email });
        cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        
        await client.query('COMMIT');
    
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('An unexpected error occurred during sign-up:', error);
        return { error: 'An unexpected server error occurred.' };
    } finally {
        client.release();
    }
  
    redirect('/verify-otp');
}

export async function signInAction(prevState: any, formData: FormData) {
  const validation = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.email?.[0] || validation.error.flatten().fieldErrors.password?.[0] };
  }
  
  const { email, password } = validation.data;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return { error: 'Invalid email or password.' };
    }

    if (!user.verified) {
      const otp = await generateAndSaveOtp(email);
      await sendVerificationEmail(
          email, 
          otp, 
          'Your ChronoComment Verification Code',
          `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
            <h2>Welcome to ChronoComment!</h2>
            <p>Your one-time verification code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">{{otp}}</p>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
          </div>`
      );

      const verificationToken = await createVerificationToken({ email });
      cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      redirect('/verify-otp');
    }

    const sessionToken = await createSessionToken({ userId: user.id, email: user.email });
    cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    console.error('An unexpected error occurred during sign-in:', error);
    return { error: 'An unexpected server error occurred. Please try again.' };
  }

  redirect('/dashboard');
}


export async function verifyOtpAction(prevState: any, formData: FormData) {
    const otp = formData.get('otp') as string;
    const validation = OTPSchema.safeParse(otp);

    if (!validation.success) {
        return { error: validation.error.flatten().formErrors[0] };
    }

    try {
        const token = cookies().get('verification_token')?.value;
        if (!token) {
            return { error: 'Your verification session has expired. Please try signing up or logging in again.' };
        }

        const payload: any = await verifyVerificationToken(token);
        if (!payload || !payload.email) {
            return { error: 'Invalid verification token. Please try again.' };
        }
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [payload.email]);
        const user = result.rows[0];

        if (!user) {
            return { error: 'User not found. Please try signing up again.' };
        }
        
        if (user.otp !== otp) {
          return { error: 'The entered code is incorrect.' };
        }

        if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
          return { error: 'This OTP has expired. Please request a new one.' };
        }
        
        await db.query(
            'UPDATE users SET verified = $1, otp = $2, "otpExpires" = $3 WHERE email = $4',
            [true, null, null, user.email]
        );

        cookies().delete('verification_token');
        const sessionToken = await createSessionToken({ userId: user.id, email: user.email });
        cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('An unexpected error occurred during OTP verification:', error);
        return { error: 'An unexpected server error occurred.' };
    }

    redirect('/dashboard');
}

export async function resendOtpAction() {
    try {
        const token = cookies().get('verification_token')?.value;
        if (!token) {
            return { error: 'Your verification session has expired. Please try signing up or logging in again.' };
        }
        const payload: any = await verifyVerificationToken(token);
        if (!payload || !payload.email) {
            return { error: 'Invalid verification token. Please try again.' };
        }

        const otp = await generateAndSaveOtp(payload.email);
        await sendVerificationEmail(
            payload.email,
            otp,
            'Your New ChronoComment Verification Code',
            `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <h2>Here is Your New Code</h2>
                <p>Your new one-time verification code is:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">{{otp}}</p>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>`
        );
        return { success: 'A new verification code has been sent to your email.' };
    } catch(e) {
        console.error("Error in resendOtpAction:", e);
        return { error: 'An unexpected error occurred while resending the code.' };
    }
}

export async function logOutAction() {
    cookies().delete('session_token');
    redirect('/signin');
}
