
'use server';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getUserIdFromSession } from '../utils/auth-helpers';
import { getClient } from '../db';
import { redirect } from 'next/navigation';

// Ensure these are set in your .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

function createOAuth2Client(): OAuth2Client {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
        throw new Error('Google OAuth credentials are not configured in environment variables.');
    }
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

export async function getGoogleAuthUrlAction() {
    try {
        const oauth2Client = createOAuth2Client();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.force-ssl'
            ],
            prompt: 'consent' // Forces the consent screen to be shown, which is necessary to get a refresh token every time.
        });
        return { success: true, url };
    } catch (error: any) {
        console.error("Error generating Google Auth URL:", error.message);
        return { success: false, error: error.message };
    }
}

export async function setGoogleCredentialsAction(code: string) {
    const client = await getClient();
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const oauth2Client = createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            throw new Error('Failed to retrieve the necessary authentication tokens from Google.');
        }

        await client.query(
            `UPDATE user_settings 
             SET "googleAccessToken" = $1, "googleRefreshToken" = $2, "googleTokenExpiry" = $3
             WHERE "userId" = $4`,
            [
                tokens.access_token,
                tokens.refresh_token,
                new Date(tokens.expiry_date),
                userId
            ]
        );

    } catch (error: any) {
        console.error('Error setting Google credentials:', error.message);
        // Maybe redirect to an error page or show a toast on the dashboard
    } finally {
        client.release();
    }
    redirect('/dashboard');
}
