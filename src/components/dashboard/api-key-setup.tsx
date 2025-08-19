
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2, Save, Terminal, AlertCircle, CheckCircle, Youtube } from 'lucide-react';
import { updateApiKeyAction } from '@/lib/actions/settings';
import { getGoogleAuthUrlAction } from '@/lib/actions/youtube-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ApiKeySetupProps {
    currentApiKey: string | null;
    isYouTubeConnected: boolean;
    onCredentialsUpdate: () => void;
    isLoading: boolean;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={disabled || pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Save className="mr-2" />
                    Save API Key
                </>
            )}
        </Button>
    );
}

export function ApiKeySetup({ currentApiKey, isYouTubeConnected, onCredentialsUpdate, isLoading }: ApiKeySetupProps) {
    const initialState = { message: null, error: false, apiKey: null };
    const [state, formAction] = useActionState(updateApiKeyAction, initialState);
    const [localApiKey, setLocalApiKey] = useState(currentApiKey ?? '');
    const { toast } = useToast();

     useEffect(() => {
        if (currentApiKey !== null) {
            setLocalApiKey(currentApiKey);
        }
    }, [currentApiKey]);

    useEffect(() => {
        if (state?.apiKey && !state.error) {
            onCredentialsUpdate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const handleConnectYouTube = async () => {
        const result = await getGoogleAuthUrlAction();
        if (result.success && result.url) {
            window.location.href = result.url;
        } else {
            toast({
                title: 'Connection Error',
                description: result.error || 'Could not connect to YouTube. Please try again.',
                variant: 'destructive',
            })
        }
    }

    if (isLoading) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className='space-y-6'>
                    <div className="space-y-4 rounded-lg border p-4">
                        <Skeleton className="h-5 w-48" />
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </div>
                     <div className="space-y-4 rounded-lg border p-4">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-10 w-48" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Campaign Setup</CardTitle>
                <CardDescription>
                    Configure your API Key and connect your YouTube account to get started.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                       <span className="flex items-center justify-center text-sm h-6 w-6 rounded-full bg-primary text-primary-foreground">1</span> 
                       Provide YouTube API Key
                    </h3>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="apiKey"
                                    name="apiKey"
                                    type="password"
                                    placeholder="Enter your YouTube Data API key"
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <SubmitButton disabled={!localApiKey || localApiKey === currentApiKey} />
                        {state && state.message && (
                            <Alert variant={state.error ? 'destructive' : 'default'}>
                            {state.error ?  <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            <AlertTitle>{state.error ? 'Validation Failed' : 'Success'}</AlertTitle>
                            <AlertDescription>
                                {state.message}
                            </AlertDescription>
                            </Alert>
                        )}
                    </form>
                    
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Where to find your API Key</AlertTitle>
                        <AlertDescription>
                            You can obtain a YouTube Data API key from the{' '}
                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline underline-offset-4">
                                Google Cloud Console
                            </a>
                            . Make sure the YouTube Data API v3 is enabled for your project.
                        </AlertDescription>
                    </Alert>
                </div>
                 {/* Step 2 */}
                <div className="space-y-4 rounded-lg border p-4">
                     <h3 className="font-semibold flex items-center gap-2">
                       <span className="flex items-center justify-center text-sm h-6 w-6 rounded-full bg-primary text-primary-foreground">2</span> 
                       Connect YouTube Account
                    </h3>
                    <p className="text-sm text-muted-foreground">To post comments, you must grant ChronoComment permission to manage your YouTube account.</p>
                    
                    {isYouTubeConnected ? (
                        <Alert variant="default">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Account Connected</AlertTitle>
                            <AlertDescription>
                                Your YouTube account is successfully connected. You can now run campaigns.
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Button onClick={handleConnectYouTube} disabled={!currentApiKey}>
                            <Youtube className="mr-2" />
                            Connect YouTube Account
                        </Button>
                    )}

                    {!currentApiKey && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Please provide a valid YouTube API key in Step 1 to enable connecting your account.</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
