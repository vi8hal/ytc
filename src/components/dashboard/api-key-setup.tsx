
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2, Save, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import { updateApiKeyAction } from '@/lib/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';

interface ApiKeySetupProps {
    currentApiKey: string | null;
    onApiKeyUpdate: (apiKey: string) => void;
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


export function ApiKeySetup({ currentApiKey, onApiKeyUpdate, isLoading }: ApiKeySetupProps) {
    const initialState = { message: null, error: false, apiKey: null };
    const [state, formAction] = useActionState(updateApiKeyAction, initialState);
    const [localApiKey, setLocalApiKey] = useState(currentApiKey ?? '');

     useEffect(() => {
        if (currentApiKey !== null) {
            setLocalApiKey(currentApiKey);
        }
    }, [currentApiKey]);

    useEffect(() => {
        if (state?.apiKey && !state.error) {
            onApiKeyUpdate(state.apiKey);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);


    if (isLoading) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Step 1: YouTube API Setup</CardTitle>
                <CardDescription>
                    Your YouTube Data API key is required to search for channels and videos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

            </CardContent>
        </Card>
    );
}
