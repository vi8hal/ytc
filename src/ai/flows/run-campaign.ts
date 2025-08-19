
'use server';

/**
 * @fileOverview Implements the comment shuffling and sending functionality.
 *
 * - runCampaign - Entry point function to shuffle and send comments.
 * - CampaignInput - Input type definition for the function.
 * - CampaignOutput - Output type definition for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getClient } from '@/lib/db';
import { getUserIdFromSession } from '@/lib/utils/auth-helpers';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const CampaignInputSchema = z.object({
  credentialId: z.number().int().positive().describe('The ID of the credential set to use for this campaign.'),
  comments: z.array(z.string()).length(4).describe('An array of four comments to be shuffled and sent.'),
  videoIds: z.array(z.string()).describe('An array of YouTube video IDs to send comments to.'),
});
export type CampaignInput = z.infer<typeof CampaignInputSchema>;

const CampaignOutputSchema = z.object({
  campaignId: z.number().describe('The ID of the newly created campaign.'),
  results: z.array(z.object({
    videoId: z.string().describe('The YouTube video ID the comment was sent to.'),
    commentSent: z.string().describe('The comment that was sent.'),
    timestamp: z.number().describe('The timestamp within the 10-minute range when the comment was sent (in seconds).'),
  })).describe('Results of sending comments to videos.'),
});
export type CampaignOutput = z.infer<typeof CampaignOutputSchema>;

async function getAuthenticatedClient(userId: number, credentialId: number): Promise<OAuth2Client> {
    const client = await getClient();
    try {
        const res = await client.query(
            `SELECT "googleClientId", "googleClientSecret", "googleRedirectUri", "googleAccessToken", "googleRefreshToken", "googleTokenExpiry" 
             FROM user_credentials WHERE "userId" = $1 AND id = $2`,
            [userId, credentialId]
        );
        const credentials = res.rows[0];
        if (!credentials) {
            throw new Error("Could not find the specified credentials for this user.");
        }
        if (!credentials.googleAccessToken || !credentials.googleRefreshToken) {
            throw new Error("YouTube account not connected or tokens are missing for this credential set.");
        }

        const oauth2Client = new google.auth.OAuth2(
            credentials.googleClientId,
            credentials.googleClientSecret,
            credentials.googleRedirectUri
        );

        oauth2Client.setCredentials({
            access_token: credentials.googleAccessToken,
            refresh_token: credentials.googleRefreshToken,
            expiry_date: credentials.googleTokenExpiry ? new Date(credentials.googleTokenExpiry).getTime() : null,
        });
        
        // Auto-refresh logic: Check if the token is expired or close to expiring.
        if (credentials.googleTokenExpiry && new Date() >= new Date(new Date(credentials.googleTokenExpiry).getTime() - 5 * 60 * 1000)) {
            const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
            
            await client.query(
                `UPDATE user_credentials 
                 SET "googleAccessToken" = $1, "googleTokenExpiry" = $2, "googleRefreshToken" = $3
                 WHERE id = $4`,
                [
                    newTokens.access_token,
                    newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
                    newTokens.refresh_token || credentials.googleRefreshToken, // Persist refresh token
                    credentialId
                ]
            );
            oauth2Client.setCredentials(newTokens);
        }

        return oauth2Client;
    } finally {
        client.release();
    }
}


export async function runCampaign(input: CampaignInput): Promise<CampaignOutput> {
  return runCampaignFlow(input);
}

const runCampaignFlow = ai.defineFlow(
  {
    name: 'runCampaignFlow',
    inputSchema: CampaignInputSchema,
    outputSchema: CampaignOutputSchema,
  },
  async input => {
    const userId = await getUserIdFromSession();
    if (!userId) {
        throw new Error("User not authenticated.");
    }
    const {credentialId, comments, videoIds} = input;
    
    const dbClient = await getClient();
    let campaignId: number;

    try {
        await dbClient.query('BEGIN');
        
        // 1. Create the campaign record
        const campaignRes = await dbClient.query(
            `INSERT INTO campaigns ("userId", "credentialId", comments, "videoIds")
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [userId, credentialId, comments, videoIds]
        );
        campaignId = campaignRes.rows[0].id;

        // 2. Prepare for comment posting
        const results: CampaignOutput['results'] = [];
        const oauth2Client = await getAuthenticatedClient(userId, credentialId);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const campaignStartTime = Date.now();

        // 3. Loop through videos and post comments
        for (const videoId of videoIds) {
          const commentIndex = Math.floor(Math.random() * comments.length);
          const commentText = comments[commentIndex];
          const timestamp = Math.floor(Math.random() * 600); // Simulate posting over a 10-minute window.
          const postedAt = new Date(campaignStartTime + timestamp * 1000);

          try {
            await youtube.commentThreads.insert({
                part: ['snippet'],
                requestBody: {
                    snippet: {
                        videoId: videoId,
                        topLevelComment: {
                            snippet: {
                                textOriginal: commentText,
                            }
                        }
                    }
                }
            });

            // 4. Log the successful event
            await dbClient.query(
                `INSERT INTO campaign_events ("campaignId", "videoId", comment, "postedAt")
                 VALUES ($1, $2, $3, $4)`,
                [campaignId, videoId, commentText, postedAt]
            );

            results.push({
                videoId: videoId,
                commentSent: commentText,
                timestamp: timestamp,
            });

          } catch (error: any) {
             console.error(`Failed to post comment to video ${videoId}:`, error.message);
             // A more robust implementation might collect errors and return them.
             throw new Error(`Failed to post comment to video ${videoId}. Reason: ${error.errors?.[0]?.message || error.message}. Please check your account permissions and API quota.`);
          }
        }
        
        await dbClient.query('COMMIT');
        return { campaignId, results };

    } catch (flowError: any) {
        await dbClient.query('ROLLBACK');
        console.error('Error during campaign flow, rolling back transaction.', flowError);
        throw flowError; // Re-throw the error to be caught by the action
    } finally {
        dbClient.release();
    }
  }
);
