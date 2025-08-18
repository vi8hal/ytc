
'use server';

import { google } from 'googleapis';
import { z } from 'zod';
import { getUserIdFromSession } from "@/lib/utils/auth-helpers";
import { getClient } from "@/lib/db";

const ApiKeySchema = z.string().min(1, { message: 'API Key cannot be empty.' });

export type UpdateApiKeyActionState = {
    message: string | null;
    error: boolean;
    apiKey?: string | null;
}

async function validateApiKey(apiKey: string): Promise<{isValid: boolean, message: string}> {
    try {
        const youtube = google.youtube({ version: 'v3', auth: apiKey });
        await youtube.search.list({
            part: ['id'],
            q: 'test',
            maxResults: 1,
        });
        return { isValid: true, message: 'Your API Key is valid and has been saved.' };
    } catch (error: any) {
        if (error.code === 403 || (error.errors && error.errors[0]?.reason === 'forbidden')) {
            return { isValid: false, message: 'The provided API Key does not have the YouTube Data API v3 service enabled.' };
        }
         if (error.code === 400 || (error.errors && (error.errors[0]?.reason === 'keyInvalid' || error.errors[0]?.reason === 'badRequest'))) {
            return { isValid: false, message: 'The provided API Key is malformed or invalid.' };
        }
        console.error("API Key Validation Error:", error);
        return { isValid: false, message: 'Could not validate the API Key due to an unexpected error.' };
    }
}

export async function updateApiKeyAction(prevState: any, formData: FormData): Promise<UpdateApiKeyActionState> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { error: true, message: 'Authentication failed. Please sign in again.' };
    }

    const apiKey = formData.get('apiKey') as string;
    const validation = ApiKeySchema.safeParse(apiKey);

    if (!validation.success) {
        const errorMessage = validation.error.flatten().formErrors[0]
        return { error: true, message: errorMessage };
    }
    
    const { isValid, message } = await validateApiKey(apiKey);
    if (!isValid) {
        return { error: true, message: message };
    }
    
    const client = await getClient();
    try {
        await client.query(
            `INSERT INTO user_settings ("userId", "youtubeApiKey") 
             VALUES ($1, $2)
             ON CONFLICT ("userId") 
             DO UPDATE SET "youtubeApiKey" = EXCLUDED."youtubeApiKey"`,
            [userId, apiKey]
        );
        
        return { error: false, message: message, apiKey: apiKey };

    } catch(e) {
        console.error("Error saving API Key:", e);
        const errorMessage = 'An unexpected server error occurred while saving the key.';
        return { error: true, message: errorMessage };
    } finally {
        client.release();
    }
}

type AppSettings = {
    apiKey: string | null;
    isYouTubeConnected: boolean;
};

export async function getAppSettingsAction(): Promise<{ settings: AppSettings | null, error: string | null }> {
    const client = await getClient();
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { settings: null, error: 'User not authenticated' };
        }
        const result = await client.query('SELECT "youtubeApiKey", "googleAccessToken", "googleRefreshToken" FROM user_settings WHERE "userId" = $1', [userId]);
        const userSettings = result.rows[0];

        const settings: AppSettings = {
             apiKey: userSettings?.youtubeApiKey || null,
             isYouTubeConnected: !!(userSettings?.googleAccessToken && userSettings?.googleRefreshToken)
        }
        
        return { settings: settings, error: null };

    } catch (error) {
        console.error("Error in getAppSettingsAction:", error);
        return { settings: null, error: 'Failed to retrieve app settings from the database.' };
    } finally {
        client.release();
    }
}
