'use client';

import { useState, useEffect, useCallback, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Loader2, Save, AlertCircle, CheckCircle, Youtube, Trash2 } from 'lucide-react';
import type { CredentialSet } from '@/lib/actions/credentials';
import { saveCredentialSetAction, getCredentialSetsAction } from '@/lib/actions/credentials';
import { getGoogleAuthUrlAction } from '@/lib/actions/youtube-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '../ui/skeleton';

interface CredentialManagerProps {
    selectedCredentialSet: CredentialSet | null;
    onCredentialSelect: (credential: CredentialSet | null) => void;
}

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 animate-spin" /> Saving...</> : <><Save className="mr-2" /> Save Credentials</>}
        </Button>
    )
}

function AddCredentialForm({ onSave }: { onSave: () => void }) {
    const [state, formAction] = useActionState(saveCredentialSetAction, { success: false, message: null });
    const { toast } = useToast();

    useEffect(() => {
        if(state?.message) {
            toast({
                title: state.success ? 'Success' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
            if (state.success) {
                onSave();
            }
        }
    }, [state, toast, onSave]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="credentialName">Credential Set Name</Label>
                <Input id="credentialName" name="credentialName" placeholder="e.g., 'My Main Account'" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="youtubeApiKey">YouTube Data API Key</Label>
                <Input id="youtubeApiKey" name="youtubeApiKey" placeholder="AIzaSy..." required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="googleClientId">Google Client ID</Label>
                <Input id="googleClientId" name="googleClientId" placeholder="....apps.googleusercontent.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                <Input id="googleClientSecret" name="googleClientSecret" type="password" placeholder="GOCSPX-..." required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="googleRedirectUri">Google Authorized Redirect URI</Label>
                <Input id="googleRedirectUri" name="googleRedirectUri" placeholder="http://localhost:3000/api/auth/callback/google" required />
            </div>
            <DialogFooter>
                <SaveButton />
            </DialogFooter>
        </form>
    );
}

export function CredentialManager({ selectedCredentialSet, onCredentialSelect }: CredentialManagerProps) {
    const [credentialSets, setCredentialSets] = useState<CredentialSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const fetchCredentials = useCallback(async () => {
        setIsLoading(true);
        try {
            const sets = await getCredentialSetsAction();
            setCredentialSets(sets);
            // If there's a selected set, find its updated version
            if (selectedCredentialSet) {
                const updatedSelected = sets.find(s => s.id === selectedCredentialSet.id) || null;
                onCredentialSelect(updatedSelected);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load credential sets.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast, onCredentialSelect, selectedCredentialSet]);

    useEffect(() => {
        fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConnect = async (credentialSet: CredentialSet) => {
        const { id, googleClientId, googleRedirectUri } = credentialSet;
        const result = await getGoogleAuthUrlAction(id, googleClientId, googleRedirectUri);
        if (result.success && result.url) {
            window.location.href = result.url;
        } else {
            toast({
                title: 'Connection Error',
                description: result.error || 'Could not connect to YouTube. Please check credentials and try again.',
                variant: 'destructive',
            })
        }
    }
    
    const handleFormSave = () => {
        setIsFormOpen(false);
        fetchCredentials();
    }
    
    if (isLoading) {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-xl">Step 1: Select & Connect Credentials</CardTitle>
                        <CardDescription>Choose a credential set for this campaign, or add a new one.</CardDescription>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary"><PlusCircle className="mr-2"/> Add New</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Credential Set</DialogTitle>
                                <DialogDescription>Provide the necessary API and OAuth credentials. This information will be stored securely.</DialogDescription>
                            </DialogHeader>
                            <AddCredentialForm onSave={handleFormSave} />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                 {selectedCredentialSet && (
                    <Alert variant="default" className="border-primary/50">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <AlertTitle>Credential Set Selected</AlertTitle>
                        <AlertDescription>
                            You have selected <span className="font-semibold">"{selectedCredentialSet.credentialName}"</span>. You can now proceed to the next step.
                        </AlertDescription>
                    </Alert>
                )}

                {credentialSets && credentialSets.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full" value={selectedCredentialSet?.id.toString()}>
                        {credentialSets.map(set => (
                             <AccordionItem value={set.id.toString()} key={set.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <span>{set.credentialName}</span>
                                        {set.isConnected ? (
                                            <div className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="h-3 w-3" /> Connected</div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs text-amber-500"><AlertCircle className="h-3 w-3" /> Not Connected</div>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 rounded-lg border bg-background/50 p-4">
                                        {set.isConnected ? (
                                            <Alert variant="default">
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertTitle>Account Connected</AlertTitle>
                                                <AlertDescription>
                                                    This credential set is authorized to post comments.
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <div className="space-y-3">
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Account Not Connected</AlertTitle>
                                                    <AlertDescription>
                                                        You must connect this account to grant permission for posting comments.
                                                    </AlertDescription>
                                                </Alert>
                                                <Button onClick={() => handleConnect(set)}>
                                                    <Youtube className="mr-2" />
                                                    Connect YouTube Account
                                                </Button>
                                            </div>
                                        )}
                                        {selectedCredentialSet?.id !== set.id && (
                                            <Button variant="outline" size="sm" onClick={() => onCredentialSelect(set)}>Select this credential set</Button>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>You have no saved credentials. Click "Add New" to get started.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

    