
import { setGoogleCredentialsAction } from '@/lib/actions/youtube-auth';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
        await setGoogleCredentialsAction(code, state);
        // The action handles the redirect, so we don't need to do anything else here.
        // In case the redirect in the action fails, this response will be sent.
        return new Response('Authentication successful! You can close this tab.', { status: 200 });
    } else {
        const error = searchParams.get('error');
        const errorMessage = `Authentication failed: ${error || 'No authorization code or state provided.'}`;
        return new Response(errorMessage, { status: 400 });
    }
}
