'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getClient } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import { sendVerificationEmail, generateAndSaveOtp } from '@/lib/utils/auth-helpers';
import { EmailSchema, NameSchema, OTPSchema, PasswordSchema } from '@/lib/schemas';
import { type VercelPoolClient } from '@vercel/postgres';

const SignUpSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});

const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
  'remember-me': z.enum(['on']).optional(),
});

const VerifyOtpSchema = z.object({
    email: EmailSchema,
    otp: OTPSchema
});


export async function signUpAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validation = SignUpSchema.safeParse(rawData);

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).flat()[0] || 'Invalid input.';
        return { error: errorMessage, showVerificationLink: false, email: null };
    }
    
    const { name, email, password } = validation.data;
    const client = await getClient();

    try {
        await client.query('BEGIN');
        
        const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email]);
        const existingUser = existingUserResult.rows[0];

        if (existingUser) {
            if (existingUser.verified) {
                await client.query('ROLLBACK');
                return { error: 'An account with this email already exists and is verified.', showVerificationLink: false, email: email };
            } else {
                // User exists but is not verified. Resend OTP and guide them to verify.
                const otp = await generateAndSaveOtp(client, email);
                await sendVerificationEmail(
                    email, 
                    otp,
                    'Your DCX1 Verification Code',
                    `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                        <h2>Welcome Back to DCX1!</h2>
                        <p>Your new one-time verification code is:</p>
                        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                        <p style="color: #666;">This code will expire in 10 minutes.</p>
                    </div>`
                );
                
                await client.query('COMMIT');
                return { error: "This email is already registered but not verified. We've sent a new code.", showVerificationLink: true, email };
            }
        }

        // This is a new user
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await client.query(
            'INSERT INTO users (name, email, password, verified) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, false]
        );

        const otp = await generateAndSaveOtp(client, email);
        
        await sendVerificationEmail(
            email, 
            otp,
            'Your DCX1 Verification Code',
            `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <h2>Welcome to DCX1!</h2>
                <p>Your one-time verification code is:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>`
        );
        
        await client.query('COMMIT');
    
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('[SIGNUP_ERROR]', error);
        return { error: 'An unexpected server error occurred. Please try again.', showVerificationLink: false, email: email };
    } finally {
        client.release();
    }
  
    redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
}

export async function signInAction(prevState: any, formData: FormData) {
  const validation = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validation.success) {
    return { error: 'Invalid email or password.' };
  }
  
  const { email, password } = validation.data;
  const rememberMe = validation.data['remember-me'] === 'on';
  const client = await getClient();

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
      return { error: 'Invalid email or password.' };
    }

    if (!user.verified) {
       await client.query('BEGIN');
       const otp = await generateAndSaveOtp(client, email);
       await sendVerificationEmail(
          email, 
          otp, 
          'Your DCX1 Verification Code',
          `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
            <h2>Complete Your Sign-In</h2>
            <p>Your one-time verification code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
          </div>`
      );
      await client.query('COMMIT');
      redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const oneDayInSeconds = 24 * 60 * 60;
    const expiresIn = rememberMe ? `${thirtyDaysInSeconds}s` : `${oneDayInSeconds}s`;

    const sessionToken = await createSessionToken({ userId: user.id, email: user.email }, expiresIn);
    
    const cookieOptions: any = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/' 
    };

    if (rememberMe) {
        cookieOptions.maxAge = thirtyDaysInSeconds;
    }

    cookies().set('session_token', sessionToken, cookieOptions);

  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')){
        await client.query('ROLLBACK').catch(e => console.error("[SIGNIN_ROLLBACK_ERROR]", e));
        throw error;
    };
    console.error('[SIGNIN_ERROR]', error);
    return { error: 'An unexpected server error occurred. Please try again.' };
  } finally {
      client.release();
  }

  redirect('/dashboard');
}


export async function verifyOtpAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validation = VerifyOtpSchema.safeParse(rawData);

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).flat()[0] || 'Invalid input.';
        return { error: errorMessage };
    }
    
    const { email, otp } = validation.data;
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Lock the row for update to prevent race conditions
        const result = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email]);
        const user = result.rows[0];

        if (!user) {
            await client.query('ROLLBACK');
            return { error: 'No account found for this email address. Please sign up.' };
        }
        
        if (user.otp !== otp) {
          await client.query('ROLLBACK');
          return { error: 'The entered code is incorrect.' };
        }

        if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
          await client.query('ROLLBACK');
          return { error: 'This OTP has expired. Please request a new one by trying to sign up or sign in again.' };
        }
        
        await client.query(
            'UPDATE users SET verified = TRUE, otp = NULL, "otpExpires" = NULL WHERE email = $1',
            [user.email]
        );

        const sessionToken = await createSessionToken({ userId: user.id, email: user.email });
        cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
        
        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('[VERIFY_OTP_ERROR]', error);
        return { error: 'An unexpected server error occurred.' };
    } finally {
        client.release();
    }

    redirect('/dashboard');
}

export async function resendOtpAction(email: string): Promise<{error?: string | null, success?: string | null}> {
    const client = await getClient();
    try {
        const validation = EmailSchema.safeParse(email);
        if (!validation.success) {
            return { error: "Invalid email address." };
        }
        
        await client.query('BEGIN');

        const result = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email]);
        const user = result.rows[0];

        if (!user) {
            await client.query('ROLLBACK');
            return { error: 'No user found with this email. Please sign up first.' };
        }
        if (user.verified) {
             await client.query('ROLLBACK');
            return { success: 'This account is already verified. You can sign in.' };
        }

        const otp = await generateAndSaveOtp(client, email);
        await sendVerificationEmail(
            email,
            otp,
            'Your New DCX1 Verification Code',
            `<div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <h2>Here is Your New Code</h2>
                <p>Your new one-time verification code is:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>`
        );
        await client.query('COMMIT');
        return { success: 'A new verification code has been sent to your email.' };
    } catch(e) {
        await client.query('ROLLBACK');
        console.error("[RESEND_OTP_ERROR]", e);
        return { error: 'An unexpected error occurred while resending the code.' };
    } finally {
        client.release();
    }
}

export async function logOutAction() {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token');

    if(sessionToken) {
        cookieStore.delete('session_token');
    }
    
    redirect('/signin');
}
