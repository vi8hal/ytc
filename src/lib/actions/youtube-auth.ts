
'use server';

import { google } from 'googleapis';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/db';
import { getUserIdFromSession } from '../utils/auth-helpers';

// These scopes are required to post comments on behalf of the user.
const scopes = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

export async function getGoogleAuthUrlAction(credentialId: number) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    
    const client = await getClient();
    try {
        const res = await client.query(
            'SELECT "googleClientId", "googleRedirectUri" FROM user_credentials WHERE id = $1 AND "userId" = $2',
            [credentialId, userId]
        );

        if (res.rowCount === 0) {
            return { success: false, error: 'Credential set not found or permission denied.' };
        }
        const { googleClientId, googleRedirectUri } = res.rows[0];

        if (!googleClientId || !googleRedirectUri) {
             return { success: false, error: 'Client ID and Redirect URI must be configured for this credential set.' };
        }

        const oauth2Client = new google.auth.OAuth2(
            googleClientId,
            '', // clientSecret is not needed for generating the auth URL
            googleRedirectUri
        );

        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Force prompt to ensure a refresh token is always sent
            scope: scopes,
            state: credentialId.toString(), // Pass credentialId as state
        });
        
        return { success: true, url: authorizeUrl };

    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        return { success: false, error: 'Failed to generate authentication URL.' };
    } finally {
        client.release();
    }
}

export async function setGoogleCredentialsAction(code: string, state: string) {
    const userId = await getUserIdFromSession();
    const dbClient = await getClient();
    
    try {
        if (!userId) {
            throw new Error("User not authenticated.");
        }
        const credentialId = parseInt(state, 10);
        if (isNaN(credentialId)) {
            throw new Error('Invalid state provided. Could not identify credential set.');
        }
        
        await dbClient.query('BEGIN');
        
        const credRes = await dbClient.query(
            'SELECT "googleClientId", "googleClientSecret", "googleRedirectUri" FROM user_credentials WHERE id = $1 AND "userId" = $2',
            [credentialId, userId]
        );

        if (credRes.rowCount === 0) {
            throw new Error('Could not find the specified credential set or permission denied.');
        }
        const { googleClientId, googleClientSecret, googleRedirectUri } = credRes.rows[0];

        const oauth2Client = new google.auth.OAuth2(
            googleClientId,
            googleClientSecret,
            googleRedirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Failed to obtain access and refresh tokens from Google. Please ensure you are granting offline access.');
        }

        const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

        await dbClient.query(
            `UPDATE user_credentials 
             SET "googleAccessToken" = $1, "googleRefreshToken" = $2, "googleTokenExpiry" = $3, "isConnected" = TRUE 
             WHERE id = $4`,
            [tokens.access_token, tokens.refresh_token, expiryDate, credentialId]
        );
        
        await dbClient.query('COMMIT');
        
    } catch (error: any) {
        await dbClient.query('ROLLBACK').catch(e => console.error("[GOOGLE_CALLBACK_ROLLBACK_ERROR]", e));
        const message = encodeURIComponent(error.message || 'An unexpected error occurred during authentication.');
        redirect(`/dashboard?connect=error&message=${message}`);
    } finally {
        dbClient.release();
    }
    
    redirect(`/dashboard?connect=success`);
}
