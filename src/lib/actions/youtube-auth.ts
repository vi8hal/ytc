
'use server';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getUserIdFromSession } from '../utils/auth-helpers';
import { getClient } from '../db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const AuthParamsSchema = z.object({
    credentialId: z.coerce.number().int().positive(),
    clientId: z.string().min(1),
    redirectUri: z.string().min(1),
});

export async function getGoogleAuthUrlAction(credentialId: number, clientId: string, redirectUri: string) {
    try {
        const validation = AuthParamsSchema.safeParse({ credentialId, clientId, redirectUri });
        if (!validation.success) {
            throw new Error("Invalid credential information provided.");
        }
        
        const oauth2Client = new google.auth.OAuth2(
            validation.data.clientId,
            // The client secret is retrieved on the server in the callback, not exposed here.
            undefined, 
            validation.data.redirectUri
        );

        // We store the credentialId in the state to retrieve the correct secret in the callback
        const state = JSON.stringify({ credentialId: validation.data.credentialId });

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.force-ssl'
            ],
            prompt: 'consent',
            state: Buffer.from(state).toString('base64'), // Pass state to callback
        });
        return { success: true, url };
    } catch (error: any) {
        console.error("Error generating Google Auth URL:", error.message);
        return { success: false, error: error.message };
    }
}

export async function setGoogleCredentialsAction(code: string, state: string) {
    const client = await getClient();
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
        const credentialId = z.coerce.number().int().positive().parse(decodedState.credentialId);
        
        // Retrieve the specific credentials the user is authorizing
        const credResult = await client.query(
            'SELECT "googleClientId", "googleClientSecret", "googleRedirectUri" FROM user_credentials WHERE id = $1 AND "userId" = $2',
            [credentialId, userId]
        );

        const credentials = credResult.rows[0];
        if (!credentials) {
            throw new Error("Could not find the specified credentials for this user.");
        }

        const oauth2Client = new google.auth.OAuth2(
            credentials.googleClientId,
            credentials.googleClientSecret,
            credentials.googleRedirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            throw new Error('Failed to retrieve the necessary authentication tokens from Google.');
        }

        await client.query(
            `UPDATE user_credentials 
             SET "googleAccessToken" = $1, "googleRefreshToken" = $2, "googleTokenExpiry" = $3, "isConnected" = TRUE
             WHERE id = $4 AND "userId" = $5`,
            [
                tokens.access_token,
                tokens.refresh_token,
                new Date(tokens.expiry_date),
                credentialId,
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
