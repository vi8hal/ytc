
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

    // Basic shuffling and sending logic - can be expanded with more sophisticated AI.
    for (const videoId of videoIds) {
      const commentIndex = Math.floor(Math.random() * comments.length);
      const comment = comments[commentIndex];
      // Generate a random timestamp within the 10-minute (600 seconds) range
      const timestamp = Math.floor(Math.random() * 600);

      // In a real implementation, you would use the YouTube Data API to post the comment.
      // This implementation simulates that action.
      results.push({
        videoId: videoId,
        commentSent: comment,
        timestamp: timestamp,
      });
    }

    return {results};
  }
);
