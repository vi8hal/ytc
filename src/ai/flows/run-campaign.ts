
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
  comments: z.array(z.string()).length(4).describe('An array of four comments to be shuffled and sent.'),
  videoIds: z.array(z.string()).describe('An array of YouTube video IDs to send comments to.'),
});
export type CampaignInput = z.infer<typeof CampaignInputSchema>;

const CampaignOutputSchema = z.object({
  results: z.array(z.object({
    videoId: z.string().describe('The YouTube video ID the comment was sent to.'),
    commentSent: z.string().describe('The comment that was sent.'),
    timestamp: z.number().describe('The timestamp within the 10-minute range when the comment was sent (in seconds).'),
  })).describe('Results of sending comments to videos.'),
});
export type CampaignOutput = z.infer<typeof CampaignOutputSchema>;

async function getAuthenticatedClient(): Promise<OAuth2Client> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const client = await getClient();
    try {
        const res = await client.query(
            'SELECT "googleAccessToken", "googleRefreshToken", "googleTokenExpiry" FROM user_settings WHERE "userId" = $1',
            [userId]
        );
        const settings = res.rows[0];
        if (!settings || !settings.googleAccessToken || !settings.googleRefreshToken) {
            throw new Error("YouTube account not connected or tokens are missing.");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: settings.googleAccessToken,
            refresh_token: settings.googleRefreshToken,
            expiry_date: settings.googleTokenExpiry ? new Date(settings.googleTokenExpiry).getTime() : null,
        });
        
        // Auto-refresh logic
        if (settings.googleTokenExpiry && new Date() >= new Date(settings.googleTokenExpiry)) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await client.query(
                `UPDATE user_settings 
                 SET "googleAccessToken" = $1, "googleTokenExpiry" = $2
                 WHERE "userId" = $3`,
                [
                    credentials.access_token,
                    credentials.expiry_date ? new Date(credentials.expiry_date) : null,
                    userId
                ]
            );
            oauth2Client.setCredentials(credentials);
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
    const {comments, videoIds} = input;
    const results: CampaignOutput['results'] = [];
    const oauth2Client = await getAuthenticatedClient();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });


    for (const videoId of videoIds) {
      const commentIndex = Math.floor(Math.random() * comments.length);
      const commentText = comments[commentIndex];
      const timestamp = Math.floor(Math.random() * 600);

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

        results.push({
            videoId: videoId,
            commentSent: commentText,
            timestamp: timestamp,
        });

      } catch (error: any) {
         console.error(`Failed to post comment to video ${videoId}:`, error.message);
         // Decide if you want to stop the campaign or just skip the video
         // For now, we'll just log and continue
      }
    }

    return {results};
  }
);
