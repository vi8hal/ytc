
'use server';

import { z } from 'zod';
import { runCampaign } from '@/ai/flows/run-campaign';
import type { CampaignInput, CampaignOutput } from '@/ai/flows/run-campaign';
import { getClient } from '../db';
import { getUserIdFromSession } from '../utils/auth-helpers';
import { revalidatePath } from 'next/cache';

const CampaignActionSchema = z.object({
  credentialId: z.coerce.number().int().positive({ message: "A valid credential set must be selected." }),
  comments: z.array(z.string().min(1, { message: "Comments cannot be empty."})).length(4, { message: "You must provide exactly 4 comments."}),
  videoIds: z.array(z.string().min(1)).min(1, { message: "You must select at least one video." }).max(10, { message: "You can select a maximum of 10 videos."}),
});

type CampaignState = {
  data: CampaignOutput | null;
  error: string | null;
  message: string | null;
}

export async function runCampaignAction(
  credentialId: number,
  videoIds: string[],
  comments: string[],
  prevState: CampaignState,
  formData: FormData // formData is not used but required by useActionState
): Promise<CampaignState> {
  
  try {
    const validatedData = CampaignActionSchema.safeParse({ credentialId, comments, videoIds });

    if (!validatedData.success) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      const errorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid data provided for the campaign.';
      console.error("[CAMPAIGN_VALIDATION_ERROR]", fieldErrors);
      return { data: null, error: "Validation Error", message: errorMessage };
    }
    
    const input: CampaignInput = {
      credentialId: validatedData.data.credentialId,
      comments: validatedData.data.comments,
      videoIds: validatedData.data.videoIds,
    };
    
    const result = await runCampaign(input);
    
    revalidatePath('/dashboard');
    return { data: result, error: null, message: 'Campaign completed successfully!' };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the campaign.';
    console.error("[CAMPAIGN_EXECUTION_ERROR]", errorMessage);
    return { data: null, error: "Campaign Error", message: errorMessage };
  }
}

export async function getCampaignHistory() {
    const userId = await getUserIdFromSession();
    if (!userId) {
        console.warn("getCampaignHistory called without a valid user session.");
        return [];
    }

    const client = await getClient();
    try {
        const result = await client.query(`
            SELECT 
                c.id, 
                c."createdAt", 
                uc."credentialName",
                (SELECT COUNT(*) FROM campaign_events ce WHERE ce."campaignId" = c.id) as "eventCount"
            FROM campaigns c
            JOIN user_credentials uc ON c."credentialId" = uc.id
            WHERE c."userId" = $1
            ORDER BY c."createdAt" DESC
            LIMIT 5
        `, [userId]);
        return result.rows;
    } catch (error) {
        console.error('[GET_CAMPAIGN_HISTORY_ERROR]', error);
        // Do not throw, return empty array on failure
        return [];
    } finally {
        client.release();
    }
}
