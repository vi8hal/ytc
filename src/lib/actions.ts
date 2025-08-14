'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

import {
  createSessionToken,
  createVerificationToken,
  verifyVerificationToken,
} from './auth';
import { shuffleComments } from '@/ai/flows/shuffle-comments';
import type { ShuffleCommentsInput, ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';


// Mock user database
const users: any = {};

// --- Helper Functions ---

async function sendVerificationEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your ChronoComment Verification Code',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to ChronoComment!</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // In a real app, you might want to throw an error or handle this more gracefully
    throw new Error('Could not send verification email.');
  }
}

// --- Server Actions ---

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  await new Promise(resolve => setTimeout(resolve, 1000));

  const user = users[email];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return { error: 'Invalid email or password.' };
  }

  if (!user.verified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      try {
        await sendVerificationEmail(email, otp);
      } catch (e) {
        return { error: 'Could not send verification email. Please try again.' };
      }

      const verificationToken = await createVerificationToken({ email });
      cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      redirect('/verify-otp');
  }

  const sessionToken = await createSessionToken({ email });
  cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  redirect('/dashboard');
}

export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  await new Promise(resolve => setTimeout(resolve, 1000));

  if (users[email]) {
    return { error: 'An account with this email already exists.' };
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  users[email] = { 
      name, 
      email, 
      password: hashedPassword, 
      verified: false, 
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };
  
  try {
    await sendVerificationEmail(email, otp);
  } catch(e) {
    // If email fails, don't create the user
    delete users[email];
    return { error: 'Could not send verification email. Please try again.' };
  }

  const verificationToken = await createVerificationToken({ email });
  cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
  redirect('/verify-otp');
}

export async function verifyOtpAction(prevState: any, formData: FormData) {
  const otp = formData.get('otp') as string;
  const token = cookies().get('verification_token')?.value;

  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!token) {
    return { error: 'Verification session expired. Please sign up again.' };
  }

  try {
    const payload: any = await verifyVerificationToken(token);
    const user = users[payload.email];

    if (!user) {
      return { error: 'User not found.' };
    }
    if (user.otp !== otp) {
      return { error: 'Invalid OTP.' };
    }
    if (new Date() > user.otpExpires) {
        return { error: 'OTP has expired. Please request a new one.' };
    }

    user.verified = true;
    user.otp = null;
    user.otpExpires = null;

    cookies().delete('verification_token');
    const sessionToken = await createSessionToken({ email: user.email });
    cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  } catch (error) {
    return { error: 'Invalid or expired verification session.' };
  }

  redirect('/dashboard');
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const user = users[email];
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (user) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        try {
            // Re-using the verification email function for password reset
            await sendVerificationEmail(email, otp); 
            const verificationToken = await createVerificationToken({ email, isPasswordReset: true });
            cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        } catch (e) {
            // Don't expose that the email sending failed
        }
    }

    // Always return the same message to prevent email enumeration attacks
    return { message: 'If an account with that email exists, an email with a reset code has been sent.' };
}

// GenAI action

const shuffleActionSchema = z.object({
  comments: z.array(z.string()).min(4).max(4),
  videoIds: z.array(z.string()).min(1),
});

type ShuffleState = {
  data: ShuffleCommentsOutput | null;
  error: string | null;
  message: string | null;
}

export async function shuffleCommentsAction(
  prevState: ShuffleState,
  formData: FormData
): Promise<ShuffleState> {
  try {
    const comments = [
      formData.get('comment1') as string,
      formData.get('comment2') as string,
      formData.get('comment3') as string,
      formData.get('comment4') as string,
    ];
    const videoIds = (formData.get('videoIds') as string).split(',');

    const validatedData = shuffleActionSchema.safeParse({ comments, videoIds });

    if (!validatedData.success) {
      return { data: null, error: validatedData.error.message, message: 'Invalid data provided.' };
    }
    
    const input: ShuffleCommentsInput = {
      comments: validatedData.data.comments,
      videoIds: validatedData.data.videoIds,
    };
    
    const result = await shuffleComments(input);
    
    return { data: result, error: null, message: 'Comments shuffled successfully!' };

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { data: null, error: errorMessage, message: 'Failed to shuffle comments.' };
  }
}
