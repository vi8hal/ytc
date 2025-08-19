
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
        const error = validation.error.flatten().fieldErrors;
        const message = error.credentialName?.[0] ?? error.youtubeApiKey?.[0] ?? error.googleClientId?.[0] ?? error.googleClientSecret?.[0] ?? error.googleRedirectUri?.[0] ?? 'Invalid data provided.';
        return { success: false, message: message };
    }
    
    const { credentialName, youtubeApiKey, googleClientId, googleClientSecret, googleRedirectUri } = validation.data;
    const client = await getClient();

    try {
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
        
        // After saving, attempt to validate the API key
        try {
            const youtube = google.youtube({ version: 'v3', auth: youtubeApiKey });
            await youtube.search.list({ part: ['id'], q: 'test', maxResults: 1 });
            return { success: true, message: 'Credential set saved successfully.' };
        } catch (validationError: any) {
             let warningMessage = 'Credential set saved, but the YouTube API Key may be invalid or lack permissions.';
             if (validationError.code === 400 || (validationError.errors && (validationError.errors[0]?.reason === 'keyInvalid' || validationError.errors[0]?.reason === 'badRequest'))) {
                warningMessage = 'Credentials saved, but the YouTube API Key appears to be invalid.';
            } else if (validationError.code === 403 || (validationError.errors && validationError.errors[0]?.reason === 'forbidden')) {
                warningMessage = 'Credentials saved, but the YouTube Data API v3 service may not be enabled for this API Key.';
            }
            // Return success because the data was saved, but include a warning message
            return { success: true, message: warningMessage };
        }

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while saving credentials.';
        if (error.code === '23505') { // Unique constraint violation
            errorMessage = 'A credential set with this name already exists for your account.';
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
