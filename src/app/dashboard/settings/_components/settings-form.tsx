
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2, Save } from 'lucide-react';
import { updateApiKeyAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SettingsFormProps {
    currentApiKey: string | null;
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


export function SettingsForm({ currentApiKey }: SettingsFormProps) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateApiKeyAction, { message: null, error: null });

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.error ? 'An error occurred' : 'Success!',
                description: state.message,
                variant: state.error ? 'destructive' : 'default',
            });
        }
    }, [state, toast]);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">YouTube API Credentials</CardTitle>
                <CardDescription>
                    Your API key is stored securely and used for all YouTube interactions.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                                defaultValue={currentApiKey ?? ''}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    );
}
