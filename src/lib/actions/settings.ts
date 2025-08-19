
'use server';

// This file is being deprecated in favor of the new credentials action system.
// The logic has been moved to src/lib/actions/credentials.ts to support
// multiple credential sets per user.
// This file can be safely removed in the future.

export type UpdateApiKeyActionState = {
    message: string | null;
    error: boolean;
    apiKey?: string | null;
}

export async function updateApiKeyAction(prevState: any, formData: FormData): Promise<UpdateApiKeyActionState> {
    return { error: true, message: 'This action is deprecated.' };
}

type AppSettings = {
    apiKey: string | null;
    isYouTubeConnected: boolean;
};

export async function getAppSettingsAction(): Promise<{ settings: AppSettings | null, error: string | null }> {
    return { settings: null, error: 'This action is deprecated.' };
}
