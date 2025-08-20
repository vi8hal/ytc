
'use server';

import { google } from 'googleapis';
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
