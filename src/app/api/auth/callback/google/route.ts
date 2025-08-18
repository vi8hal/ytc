
import { setGoogleCredentialsAction } from '@/lib/actions/youtube-auth';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (code) {
        await setGoogleCredentialsAction(code);
        // The action handles the redirect, so we don't need to do anything else here.
        // In case the redirect in the action fails, this response will be sent.
        return new Response('Authentication successful! You can close this tab.', { status: 200 });
    } else {
        return new Response('Authentication failed: No authorization code provided.', { status: 400 });
    }
}
