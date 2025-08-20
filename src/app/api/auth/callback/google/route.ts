
import { google } from 'googleapis';
import { type NextRequest } from 'next/server';
import { getUserIdFromSession } from '@/lib/utils/auth-helpers';
import { getClient } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const dbClient = await getClient();

    try {
        if (!code || !state) {
            const error = searchParams.get('error');
            const errorMessage = `Authentication failed: ${error || 'No authorization code or state provided.'}`;
            throw new Error(errorMessage);
        }

        const userId = await getUserIdFromSession();
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const credentialId = parseInt(state, 10);
        if (isNaN(credentialId)) {
            throw new Error('Invalid state provided. Could not identify credential set.');
        }

        await dbClient.query('BEGIN');
        
        const credRes = await dbClient.query(
            'SELECT "googleClientId", "googleClientSecret", "googleRedirectUri" FROM user_credentials WHERE id = $1 AND "userId" = $2 FOR UPDATE',
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
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('connect', 'error');
        dashboardUrl.searchParams.set('message', message);
        return Response.redirect(dashboardUrl);
    } finally {
        dbClient.release();
    }
    
    const successUrl = new URL('/dashboard', request.url);
    successUrl.searchParams.set('connect', 'success');
    return Response.redirect(successUrl);
}
