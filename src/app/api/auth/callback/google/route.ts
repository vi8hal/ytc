
import { setGoogleCredentialsAction } from '@/lib/actions/youtube-auth';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
        // The server action will handle the entire logic, including redirects.
        await setGoogleCredentialsAction(code, state);
        
        // This response is a fallback in case the redirect within the action doesn't execute as expected.
        return new Response('Authentication successful! You can close this tab.', { status: 200 });
    } else {
        const error = searchParams.get('error');
        const errorMessage = `Authentication failed: ${error || 'No authorization code or state provided.'}`;
        // Redirect back to dashboard with an error message.
        const dashboardUrl = new URL('/dashboard', request.url)
        dashboardUrl.searchParams.set('connect', 'error')
        dashboardUrl.searchParams.set('message', errorMessage)
        return Response.redirect(dashboardUrl);
    }
}
