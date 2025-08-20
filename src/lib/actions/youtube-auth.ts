
'use server';

import { google } from 'googleapis';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/db';

// Scopes for read-only access to YouTube channels.
const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

export async function getGoogleAuthUrlAction(credentialId: number, clientId: string, redirectUri: string) {
    try {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            '', // clientSecret is not needed for generating the auth URL
            redirectUri
        );

        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: credentialId.toString(), // Pass credentialId as state
        });
        
        return { success: true, url: authorizeUrl };
    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        return { success: false, error: 'Failed to generate authentication URL.' };
    }
}

export async function handleGoogleCallbackAction(code: string, state: string, clientId: string, clientSecret: string, redirectUri: string) {
    let client;
    try {
        const credentialId = parseInt(state, 10); // Retrieve credentialId from state
        if (isNaN(credentialId)) {
            throw new Error('Invalid credential ID provided.');
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Check the connection by fetching the user's channels.
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });
        
        await youtube.channels.list({
            part: ['id'],
            mine: true,
        });

        // Save the tokens to the database.
        client = await getClient();
        await client.query('BEGIN');
        await client.query(
            'UPDATE user_credentials SET "googleAccessToken" = $1, "googleRefreshToken" = $2, "isConnected" = TRUE WHERE id = $3',
            [tokens.access_token, tokens.refresh_token, credentialId]
        );
        await client.query('COMMIT');
        
        redirect(`/dashboard?connect=success`);
    } catch (error: any) {
        console.error("Error during Google callback:", error);
        const message = encodeURIComponent(error.message || 'An unexpected error occurred during authentication.');
        if(client) {
           await client.query('ROLLBACK').catch(e => console.error("[GOOGLE_CALLBACK_ROLLBACK_ERROR]", e));
        }
        redirect(`/dashboard?connect=error&message=${message}`);
    } finally {
        if(client) {
           client.release();
        }
    }
}
