
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

import {
  createSessionToken,
  createVerificationToken,
  verifySessionToken,
  verifyVerificationToken,
} from './auth';
import { db, initializeDb } from './db';
import { shuffleComments } from '@/ai/flows/shuffle-comments';
import type { ShuffleCommentsInput, ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';


// --- Zod Schemas for Validation ---

const EmailSchema = z.string().email({ message: 'Invalid email address.' });
const PasswordSchema = z.string().min(8, { message: 'Password must be at least 8 characters long.' });
const ApiKeySchema = z.string().min(1, { message: 'API Key cannot be empty.' });

const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
});

const SignUpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
  email: EmailSchema,
  password: PasswordSchema,
});

const OTPSchema = z.string().length(6, { message: 'OTP must be 6 digits.' });

const ShuffleActionSchema = z.object({
  comments: z.array(z.string().min(1, { message: "Comments cannot be empty."})).length(4, { message: "You must provide exactly 4 comments."}),
  videoIds: z.array(z.string().min(1)).min(1, { message: "You must select at least one video." }),
});

// --- Helper Functions ---

async function sendVerificationEmail(email: string, otp: string) {
  console.log(`Attempting to send verification email to: ${email}`);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_port) || 587,
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
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
      <div style="font-family: sans-serif; text-align: center; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
        <h2>Welcome to ChronoComment!</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333; background-color: #eee; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // In a real app, you might want to add more robust error handling or use a dedicated email service.
    throw new Error('Could not send verification email. Please check server configuration.');
  }
}

async function generateAndSaveOtp(email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await db.query`UPDATE users SET otp = ${otp}, "otpExpires" = ${otpExpires} WHERE email = ${email}`;
  return otp;
}

async function getUserIdFromSession() {
    const sessionToken = cookies().get('session_token')?.value;
    if (!sessionToken) return null;
    const payload = await verifySessionToken(sessionToken);
    return payload?.userId as number | null;
}


// --- Server Actions ---

export async function signInAction(prevState: any, formData: FormData) {
  console.log('Sign-in action initiated.');
  const validation = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validation.success) {
    console.warn('Sign-in validation failed:', validation.error.flatten().fieldErrors);
    return { error: validation.error.flatten().fieldErrors.email?.[0] || validation.error.flatten().fieldErrors.password?.[0] };
  }
  
  const { email, password } = validation.data;

  try {
    await initializeDb();
    const result = await db.query`SELECT * FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.warn(`Sign-in failed for email: ${email}. Invalid credentials.`);
      return { error: 'Invalid email or password.' };
    }

    if (!user.verified) {
      console.log(`User ${email} is not verified. Sending OTP.`);
      const otp = await generateAndSaveOtp(email);
      await sendVerificationEmail(email, otp);

      const verificationToken = await createVerificationToken({ email });
      cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      redirect('/verify-otp');
    }

    console.log(`User ${email} signed in successfully. Creating session.`);
    const sessionToken = await createSessionToken({ userId: user.id, email: user.email });
    cookies().set('session_token', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    console.error('An unexpected error occurred during sign-in:', error);
    return { error: 'An unexpected server error occurred. Please try again.' };
  }

  redirect('/dashboard');
}

export async function signUpAction(prevState: any, formData: FormData) {
    console.log('Sign-up action initiated.');
    const validation = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        console.warn('Sign-up validation failed:', errors);
        const errorMessage = errors.name?.[0] || errors.email?.[0] || errors.password?.[0] || 'Invalid input.';
        return { error: errorMessage };
    }

    const { name, email, password } = validation.data;

    try {
        await initializeDb();

        const existingUserResult = await db.query`SELECT * FROM users WHERE email = ${email}`;
        if (existingUserResult.rowCount > 0) {
            console.warn(`Sign-up attempt for existing email: ${email}`);
            return { error: 'An account with this email already exists.' };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        const newUserResult = await db.query`
            INSERT INTO users (name, email, password, verified, otp, "otpExpires")
            VALUES (${name}, ${email}, ${hashedPassword}, ${false}, ${otp}, ${otpExpires})
            RETURNING id
        `;
        const newUserId = newUserResult.rows[0].id;

        await db.query`
            INSERT INTO user_settings ("userId") VALUES (${newUserId});
        `;
        console.log(`New user and settings created for email: ${email}`);

        await sendVerificationEmail(email, otp);
        
        const verificationToken = await createVerificationToken({ email });
        cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
        console.error('An unexpected error occurred during sign-up:', error);
        return { error: (error as Error).message || 'An unexpected server error occurred.' };
    }
  
    redirect('/verify-otp');
}

export async function verifyOtpAction(prevState: any, formData: FormData) {
    console.log('OTP verification action initiated.');
    const otp = formData.get('otp') as string;
    const validation = OTPSchema.safeParse(otp);

    if (!validation.success) {
        console.warn('OTP validation failed:', validation.error.flatten().formErrors);
        return { error: validation.error.flatten().formErrors[0] };
    }

    try {
        const token = cookies().get('verification_token')?.value;
        let user: any;

        if (token) {
            try {
                const payload: any = await verifyVerificationToken(token);
                const result = await db.query`SELECT * FROM users WHERE email = ${payload.email}`;
                user = result.rows[0];
            } catch (e) {
                console.warn('Verification token was present but invalid:', e);
            }
        }

        if (!user) {
            console.warn('Verification token not found or invalid, trying OTP directly.');
            const result = await db.query`SELECT * FROM users WHERE otp = ${otp} AND "otpExpires" > NOW()`;
            user = result.rows[0];
        }
        
        if (!user) {
             return { error: 'Invalid or expired OTP. Please sign in again to get a new code.' };
        }
        
        if (user.otp !== otp) {
          console.warn(`Invalid OTP entered for user ${user.email}.`);
          return { error: 'The entered code is incorrect.' };
        }

        if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
          console.warn(`Expired OTP used for user ${user.email}.`);
          return { error: 'This OTP has expired. Please request a new one.' };
        }
        
        console.log(`OTP verified successfully for user: ${user.email}.`);
        await db.query`
            UPDATE users 
            SET verified = ${true}, otp = ${null}, "otpExpires" = ${null}
            WHERE email = ${user.email}
        `;

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

export async function forgotPasswordAction(prevState: any, formData: FormData) {
    console.log('Forgot password action initiated.');
    const email = formData.get('email') as string;
    const validation = EmailSchema.safeParse(email);

    if (!validation.success) {
      console.warn('Forgot password validation failed:', validation.error.flatten().formErrors);
      return { error: true, message: validation.error.flatten().formErrors[0] };
    }
    
    try {
        await initializeDb();
        const result = await db.query`SELECT * FROM users WHERE email = ${email}`;
        const user = result.rows[0];

        if (user) {
            console.log(`Password reset requested for existing user: ${email}`);
            const otp = await generateAndSaveOtp(email);
            await sendVerificationEmail(email, `Your password reset code is: ${otp}`);
            
            const verificationToken = await createVerificationToken({ email, isPasswordReset: true });
            cookies().set('verification_token', verificationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        } else {
            console.log(`Password reset requested for non-existent user: ${email}`);
        }
    } catch(e) {
        console.error("Error in forgot password action:", e);
    }
    return { error: null, message: 'If an account with that email exists, a reset code has been sent.' };
}

type ShuffleState = {
  data: ShuffleCommentsOutput | null;
  error: string | null;
  message: string | null;
}

export async function shuffleCommentsAction(
  prevState: ShuffleState,
  formData: FormData
): Promise<ShuffleState> {
  console.log('Shuffle comments action initiated.');
  try {
    const comments = [
      formData.get('comment1') as string,
      formData.get('comment2') as string,
      formData.get('comment3') as string,
      formData.get('comment4') as string,
    ];
    const videoIds = (formData.get('videoIds') as string).split(',').filter(id => id);

    const validatedData = ShuffleActionSchema.safeParse({ comments, videoIds });

    if (!validatedData.success) {
      const errorMessage = validatedData.error.flatten().fieldErrors.comments?.[0] 
        || validatedData.error.flatten().fieldErrors.videoIds?.[0]
        || 'Invalid data provided.';
      console.warn('Shuffle comments validation failed:', validatedData.error.flatten().fieldErrors);
      return { data: null, error: "Validation Error", message: errorMessage };
    }
    
    const input: ShuffleCommentsInput = {
      comments: validatedData.data.comments,
      videoIds: validatedData.data.videoIds,
    };
    
    console.log(`Shuffling ${input.comments.length} comments across ${input.videoIds.length} videos.`);
    const result = await shuffleComments(input);
    
    console.log('Comments shuffled successfully.');
    return { data: result, error: null, message: 'Comments shuffled successfully!' };

  } catch (error) {
    console.error('An unexpected error occurred during comment shuffling:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { data: null, error: errorMessage, message: 'Failed to shuffle comments.' };
  }
}


// --- YouTube API Actions ---

async function getApiKeyForCurrentUser() {
    const userId = await getUserIdFromSession();
    if (!userId) {
        throw new Error('User not authenticated.');
    }
    const result = await db.query`SELECT "youtubeApiKey" FROM user_settings WHERE "userId" = ${userId}`;
    const apiKey = result.rows[0]?.youtubeApiKey;
    if (!apiKey) {
        throw new Error('YouTube API Key not configured. Please add it in settings.');
    }
    return apiKey;
}

export async function searchChannels(query: string) {
  if (!query) return [];
  try {
    const apiKey = await getApiKeyForCurrentUser();
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    console.log(`Searching for YouTube channels with query: "${query}"`);
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults: 10,
    });

    const channels = response.data.items?.map(item => ({
      id: item.id?.channelId || '',
      name: item.snippet?.title || 'Untitled Channel',
    })).filter(c => c.id) || [];
    
    console.log(`Found ${channels.length} channels.`);
    return channels;

  } catch (error) {
    console.error('Error searching YouTube channels:', error);
    // Let the client handle the error.
    throw error;
  }
}

export async function getChannelVideos(channelId: string) {
  if (!channelId) return [];
  try {
    const apiKey = await getApiKeyForCurrentUser();
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    console.log(`Fetching videos for channel ID: ${channelId}`);
    const response = await youtube.search.list({
      part: ['snippet'],
      channelId: channelId,
      type: ['video'],
      maxResults: 20,
      order: 'date',
    });

    const videos = response.data.items?.map(item => ({
      id: item.id?.videoId || '',
      title: item.snippet?.title || 'Untitled Video',
    })).filter(v => v.id) || [];
    
    console.log(`Found ${videos.length} videos for channel ${channelId}.`);
    return videos;
  } catch (error) {
    console.error(`Error fetching videos for channel ${channelId}:`, error);
    throw error;
  }
}


// --- User Settings Actions ---

export async function getApiKeyAction() {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { apiKey: null, error: 'User not authenticated' };
        }
        const apiKey = await getApiKeyForCurrentUser().catch(() => null);
        return { apiKey: apiKey, error: null };
    } catch (error) {
        console.error("Error getting API key:", error);
        return { apiKey: null, error: 'Failed to retrieve API key.' };
    }
}

export async function updateApiKeyAction(prevState: any, formData: FormData) {
    const apiKey = formData.get('apiKey') as string;
    const validation = ApiKeySchema.safeParse(apiKey);

    if (!validation.success) {
        return { error: true, message: validation.error.flatten().formErrors[0] };
    }
    
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { error: true, message: 'Authentication failed.' };
        }

        await db.query`
            UPDATE user_settings SET "youtubeApiKey" = ${apiKey} WHERE "userId" = ${userId}
        `;

        return { error: null, message: 'API Key updated successfully.' };
    } catch(e) {
        console.error("Error in updateApiKeyAction:", e);
        return { error: true, message: 'An unexpected error occurred.' };
    }
}
