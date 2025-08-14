'use server';

import { shuffleComments } from '@/ai/flows/shuffle-comments';
import type { ShuffleCommentsInput, ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Mocked authentication and user actions

export async function signInAction(prevState: any, formData: FormData) {
  // In a real app, you'd validate credentials against a database.
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("User signed in (mocked)");
  redirect('/dashboard');
}

export async function signUpAction(prevState: any, formData: FormData) {
  // In a real app, you'd create a new user in the database.
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("User signed up (mocked)");
  redirect('/verify-otp');
}

export async function verifyOtpAction(prevState: any, formData: FormData) {
  // In a real app, you'd verify the OTP and activate the user account.
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("OTP verified (mocked)");
  redirect('/dashboard');
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  // In a real app, you'd send a password reset email.
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Password reset link sent (mocked)");
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
