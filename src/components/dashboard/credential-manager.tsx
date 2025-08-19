
'use client';

import { useState, useEffect, useCallback, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Loader2, KeyRound, Save, AlertCircle, CheckCircle, Youtube, ChevronDown, Trash2 } from 'lucide-react';
import type { CredentialSet } from '@/lib/actions/credentials';
import { saveCredentialSetAction, getCredentialSetsAction } from '@/lib/actions/credentials';
import { getGoogleAuthUrlAction } from '@/lib/actions/youtube-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
        if(state.message) {
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

    const handleConnect = async () => {
        if (!selectedCredentialSet) return;
        const { id, googleClientId, googleRedirectUri } = selectedCredentialSet;
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
                <CardTitle className="font-headline text-xl">Step 1: Select & Connect Credentials</CardTitle>
                <CardDescription>Choose a credential set for this campaign, or add a new one. You must connect the account to authorize comment posting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-between">
                                {selectedCredentialSet ? selectedCredentialSet.credentialName : 'Select a credential set...'}
                                <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            {credentialSets && credentialSets.map(set => (
                                <DropdownMenuItem key={set.id} onSelect={() => onCredentialSelect(set)}>
                                    {set.credentialName}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

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

                {selectedCredentialSet && (
                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">{selectedCredentialSet.credentialName}</h3>
                        {selectedCredentialSet.isConnected ? (
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
                                <Button onClick={handleConnect}>
                                    <Youtube className="mr-2" />
                                    Connect YouTube Account
                                </Button>
                            </div>
                        )}
                     </div>
                )}
                 {!selectedCredentialSet && credentialSets.length > 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Please select a credential set from the dropdown to continue.</AlertDescription>
                    </Alert>
                )}
                 {!selectedCredentialSet && credentialSets.length === 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>You have no saved credentials. Click "Add New" to get started.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
