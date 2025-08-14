'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';

import {
  createSessionToken,
  createVerificationToken,
  verifyVerificationToken,
} from './auth';
import { shuffleComments } from '@/ai/flows/shuffle-comments';
import type { ShuffleCommentsInput, ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';


// Mock user database
const users: any = {};

// Mock password verification
function verifyPassword(password: string, hash: string): boolean {
  // In a real app, use bcrypt.compareSync(password, hash);
  // This is a mock, so we'll just compare the password to the stored "hash" (which is just the plain password for now)
  return password === hash;
}

// Mock password hashing
function hashPassword(password: string): string {
  // In a real app, use bcrypt.hashSync(password, 10);
  return password;
}

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  await new Promise(resolve => setTimeout(resolve, 1000));

  const user = users[email];
  if (!user || !verifyPassword(password, user.password)) {
    return { error: 'Invalid email or password.' };
  }

  if (!user.verified) {
      // For the mock, we can redirect to OTP or just let them in.
      // Let's assume for now they still need to verify.
      const verificationToken = await createVerificationToken({ email });
      cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      redirect('/verify-otp');
      return { error: "Account not verified. Please check your email for the OTP." };
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

  // Storing plain password in mock DB
  const hashedPassword = hashPassword(password);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Mock OTP for ${email}: ${otp}`); // Log OTP to console for testing

  users[email] = { name, email, password: hashedPassword, verified: false, otp };

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

    user.verified = true;
    user.otp = null; // Clear OTP after successful verification

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
        user.otp = otp; // Store OTP for reset
        console.log(`Password Reset OTP for ${email}: ${otp}`); // Log to console for testing
    }

    // Always return the same message to prevent email enumeration attacks
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
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
