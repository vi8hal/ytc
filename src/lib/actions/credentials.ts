
'use server';

import { z } from 'zod';
import { getUserIdFromSession } from "@/lib/utils/auth-helpers";
import { getClient } from "@/lib/db";
import { google } from 'googleapis';

const CredentialSetSchema = z.object({
  credentialName: z.string().min(1, { message: 'Credential set name is required.' }),
  youtubeApiKey: z.string().min(1, { message: 'YouTube API Key is required.' }),
  googleClientId: z.string().min(1, { message: 'Google Client ID is required.' }),
  googleClientSecret: z.string().min(1, { message: 'Google Client Secret is required.' }),
  googleRedirectUri: z.string().min(1, { message: 'Google Redirect URI is required.' }),
});

export type CredentialSet = z.infer<typeof CredentialSetSchema> & {
    id: number;
    isConnected: boolean;
};

export async function saveCredentialSetAction(prevState: any, formData: FormData) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { success: false, message: 'Authentication failed.' };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validation = CredentialSetSchema.safeParse(rawData);

    if (!validation.success) {
        const errorMessage = validation.error.flatten().fieldErrors[0] || 'Invalid data provided.';
        return { success: false, message: errorMessage };
    }
    
    const { credentialName, youtubeApiKey, googleClientId, googleClientSecret, googleRedirectUri } = validation.data;
    const client = await getClient();

    try {
        // First, validate the API key
        const youtube = google.youtube({ version: 'v3', auth: youtubeApiKey });
        await youtube.search.list({ part: ['id'], q: 'test', maxResults: 1 });

        // If valid, insert or update the credentials
        await client.query(
            `INSERT INTO user_credentials ("userId", "credentialName", "youtubeApiKey", "googleClientId", "googleClientSecret", "googleRedirectUri")
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT ("userId", "credentialName")
             DO UPDATE SET 
                "youtubeApiKey" = EXCLUDED."youtubeApiKey",
                "googleClientId" = EXCLUDED."googleClientId",
                "googleClientSecret" = EXCLUDED."googleClientSecret",
                "googleRedirectUri" = EXCLUDED."googleRedirectUri",
                "googleAccessToken" = NULL, -- Reset connection status on credential update
                "googleRefreshToken" = NULL,
                "googleTokenExpiry" = NULL,
                "isConnected" = FALSE`,
            [userId, credentialName, youtubeApiKey, googleClientId, googleClientSecret, googleRedirectUri]
        );
        return { success: true, message: 'Credential set saved successfully.' };
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while saving credentials.';
        if (error.code === 400 || (error.errors && (error.errors[0]?.reason === 'keyInvalid' || error.errors[0]?.reason === 'badRequest'))) {
            errorMessage = 'The provided YouTube API Key is malformed or invalid.';
        }
        if (error.code === 403 || (error.errors && error.errors[0]?.reason === 'forbidden')) {
            errorMessage = 'The provided YouTube API Key does not have the YouTube Data API v3 service enabled.';
        }
        if (error.code === '23505') { // Unique constraint violation
            errorMessage = 'A credential set with this name already exists.';
        }
        console.error("Error saving credential set:", error);
        return { success: false, message: errorMessage };
    } finally {
        client.release();
    }
}

export async function getCredentialSetsAction(): Promise<CredentialSet[]> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return [];
    }
    
    const client = await getClient();
    try {
        const result = await client.query('SELECT id, "credentialName", "youtubeApiKey", "googleClientId", "googleClientSecret", "googleRedirectUri", "isConnected" FROM user_credentials WHERE "userId" = $1 ORDER BY "credentialName"', [userId]);
        return result.rows.map(row => ({...row, isConnected: row.isConnected || false}));
    } catch (error) {
        console.error("Error fetching credential sets:", error);
        return [];
    } finally {
        client.release();
    }
}
