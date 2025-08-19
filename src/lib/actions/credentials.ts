
'use server';

import { z } from 'zod';
import { getUserIdFromSession } from "@/lib/utils/auth-helpers";
import { getClient } from "@/lib/db";
import { google } from 'googleapis';
import { CredentialSetSchema } from '@/lib/schemas';

export type CredentialSet = {
    id: number;
    credentialName: string;
    youtubeApiKey: string;
    googleClientId: string;
    googleClientSecret: string;
    googleRedirectUri: string;
    isConnected: boolean;
};


export async function saveCredentialSetAction(prevState: any, formData: FormData) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { success: false, message: 'Authentication failed.' };
    }

    const rawData = Object.fromEntries(formData.entries());
    const id = rawData.id ? Number(rawData.id) : undefined;
    
    // Make secret optional only if it's an update and not provided
    const finalSchema = CredentialSetSchema.extend({
        googleClientSecret: z.string().optional() // Allow it to be empty for updates
    }).refine(data => id || (data.googleClientSecret && data.googleClientSecret.length > 0), {
        message: 'Google Client Secret is required for new credentials.',
        path: ['googleClientSecret']
    });

    const validation = finalSchema.safeParse(rawData);

    if (!validation.success) {
        const error = validation.error.flatten().fieldErrors;
        const message = Object.values(error).flat()[0] ?? 'Invalid data provided.';
        return { success: false, message: message };
    }
    
    const { credentialName, youtubeApiKey, googleClientId, googleClientSecret, googleRedirectUri } = validation.data;
    const client = await getClient();

    try {
        await client.query('BEGIN');
        
        // Check for duplicate names before inserting/updating
        const duplicateCheck = await client.query(
            'SELECT id FROM user_credentials WHERE "userId" = $1 AND "credentialName" = $2 AND id != $3',
            [userId, credentialName, id ?? null]
        );
        if (duplicateCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            return { success: false, message: 'A credential set with this name already exists for your account.' };
        }

        if (id) {
            // Update existing credential set
            const ownerCheck = await client.query('SELECT "googleClientSecret" FROM user_credentials WHERE id = $1 AND "userId" = $2', [id, userId]);
            if(ownerCheck.rowCount === 0) {
                 await client.query('ROLLBACK');
                 return { success: false, message: 'Permission denied.' };
            }
            
            // Use existing secret if a new one isn't provided
            const finalSecret = (googleClientSecret && googleClientSecret.length > 0) ? googleClientSecret : ownerCheck.rows[0].googleClientSecret;

            await client.query(
                `UPDATE user_credentials SET 
                    "credentialName" = $1, 
                    "youtubeApiKey" = $2, 
                    "googleClientId" = $3, 
                    "googleClientSecret" = $4,
                    "googleRedirectUri" = $5,
                    "googleAccessToken" = NULL, 
                    "googleRefreshToken" = NULL, 
                    "googleTokenExpiry" = NULL, 
                    "isConnected" = FALSE 
                 WHERE id = $6`,
                [credentialName, youtubeApiKey, googleClientId, finalSecret, googleRedirectUri, id]
            );

        } else {
            // Insert new credential set
            await client.query(
                `INSERT INTO user_credentials ("userId", "credentialName", "youtubeApiKey", "googleClientId", "googleClientSecret", "googleRedirectUri")
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, credentialName, youtubeApiKey, googleClientId, googleClientSecret, googleRedirectUri]
            );
        }
        
        await client.query('COMMIT');
        return { success: true, message: 'Credential set saved successfully.' };

    } catch (error: any) {
        await client.query('ROLLBACK');
        let errorMessage = 'An unexpected error occurred while saving credentials.';
        if (error.code === '23505') { // Unique constraint violation, fallback
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


export async function deleteCredentialSetAction(id: number) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { success: false, message: 'Authentication failed.' };
    }

    const client = await getClient();
    try {
        const result = await client.query('DELETE FROM user_credentials WHERE id = $1 AND "userId" = $2', [id, userId]);
        if (result.rowCount === 0) {
            return { success: false, message: 'Credential set not found or permission denied.' };
        }
        return { success: true, message: 'Credential set deleted successfully.' };
    } catch (error) {
        console.error("Error deleting credential set:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    } finally {
        client.release();
    }
}
