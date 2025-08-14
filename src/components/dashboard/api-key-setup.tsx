
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2, Save, Terminal } from 'lucide-react';
import { updateApiKeyAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
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

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
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
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateApiKeyAction, { message: null, error: null });
    const [apiKey, setApiKey] = useState(currentApiKey);

     useEffect(() => {
        setApiKey(currentApiKey);
    }, [currentApiKey]);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.error ? 'An error occurred' : 'Success!',
                description: state.message,
                variant: state.error ? 'destructive' : 'default',
            });
            if (!state.error && apiKey) {
                onApiKeyUpdate(apiKey);
            }
        }
    }, [state, toast, onApiKeyUpdate, apiKey]);

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
                    Your API key is stored securely and used for all YouTube interactions.
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
                                value={apiKey ?? ''}
                                onChange={(e) => setApiKey(e.target.value)}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <SubmitButton />
                </form>
                
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Where to find your API Key</AlertTitle>
                    <AlertDescription>
                        You can obtain a YouTube Data API key from the{' '}
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline underline-offset-4">
                            Google Cloud Console
                        </a>
                        . Make sure the API is enabled for your project.
                    </AlertDescription>
                </Alert>

            </CardContent>
        </Card>
    );
}
