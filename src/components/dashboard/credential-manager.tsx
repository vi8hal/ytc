
'use client';

import { useState, useEffect, useCallback, useActionState, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Loader2, Save, AlertCircle, CheckCircle, Youtube, Trash2, Pencil, Info, XCircle } from 'lucide-react';
import type { CredentialSet } from '@/lib/actions/credentials';
import { saveCredentialSetAction, deleteCredentialSetAction, getCredentialSetsAction } from '@/lib/actions/credentials';
import { getGoogleAuthUrlAction } from '@/lib/actions/youtube-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';

interface CredentialManagerProps {
    initialCredentialSets: CredentialSet[];
    selectedCredentialSet: CredentialSet | null;
    onCredentialSelect: (credential: CredentialSet | null) => void;
    onCredentialsUpdate: (sets: CredentialSet[]) => void;
}

function SaveButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 animate-spin" /> Saving...</> : isEditing ? <><Save className="mr-2" /> Update Credentials</> : <><PlusCircle className="mr-2" /> Add Credentials</>}
        </Button>
    )
}

function DeleteButton() {
    const { pending } = useFormStatus();
     return (
        <AlertDialogAction disabled={pending} type="submit" variant="destructive">
            {pending ? <><Loader2 className="mr-2 animate-spin" /> Deleting...</> : <>Delete</>}
        </AlertDialogAction>
    )
}

function CredentialSetForm({ onSave, credentialSet, onClear }: { onSave: () => void, credentialSet?: CredentialSet | null, onClear: () => void }) {
    const [state, formAction] = useActionState(saveCredentialSetAction, { success: false, message: null });
    const { toast } = useToast();
    
    useEffect(() => {
        if(state?.message) {
            if (state.success) {
                onSave();
            } else {
                 toast({
                    title: 'Save Failed',
                    description: state.message,
                    variant: 'destructive',
                });
            }
        }
    }, [state, onSave, toast]);

    return (
        <form action={formAction} id="credentialSetForm" className="space-y-4 rounded-lg border bg-background/50 p-4" key={credentialSet?.id ?? 'new'}>
            <h3 className="text-lg font-semibold leading-none tracking-tight">{credentialSet ? 'Edit' : 'Add New'} Credential Set</h3>
             {state?.message && !state.success && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
            <input type="hidden" name="id" value={credentialSet?.id ?? ''} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="credentialName">Credential Set Name</Label>
                    <div className="flex gap-2">
                      <Input id="credentialName" name="credentialName" placeholder="e.g., 'My Main Account'" defaultValue={credentialSet?.credentialName ?? ''} required />
                      <Button type="submit" className={credentialSet ? 'hidden' : ''}><PlusCircle/> Add</Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="youtubeApiKey">YouTube Data API Key</Label>
                    <Input id="youtubeApiKey" name="youtubeApiKey" placeholder="AIzaSy..." defaultValue={credentialSet?.youtubeApiKey ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="googleClientId">Google Client ID</Label>
                    <Input id="googleClientId" name="googleClientId" placeholder="....apps.googleusercontent.com" defaultValue={credentialSet?.googleClientId ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                    <Input id="googleClientSecret" name="googleClientSecret" type="password" placeholder={credentialSet?.id ? '(leave blank to keep unchanged)' : 'GOCSPX-...'} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="googleRedirectUri">Google Authorized Redirect URI</Label>
                    <Input id="googleRedirectUri" name="googleRedirectUri" placeholder="http://localhost:3000/api/auth/callback/google" defaultValue={credentialSet?.googleRedirectUri ?? ''} required />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                {credentialSet && (
                    <Button variant="ghost" onClick={onClear} type="button"><XCircle className="mr-2"/>Clear Form</Button>
                )}
                <SaveButton isEditing={!!credentialSet} />
            </div>
        </form>
    );
}

function CredentialManagerInternal({ initialCredentialSets, selectedCredentialSet, onCredentialSelect, onCredentialsUpdate }: CredentialManagerProps) {
    const [credentialSets, setCredentialSets] = useState<CredentialSet[]>(initialCredentialSets);
    const [isLoading, setIsLoading] = useState(false); 
    const [editingSet, setEditingSet] = useState<CredentialSet | null>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const fetchCredentials = useCallback(async () => {
        setIsLoading(true);
        try {
            const sets = await getCredentialSetsAction();
            setCredentialSets(sets);
            onCredentialsUpdate(sets);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to refresh credential sets.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast, onCredentialsUpdate]);


    useEffect(() => {
        const connectStatus = searchParams.get('connect');
        const message = searchParams.get('message');
        if (connectStatus === 'error' && message) {
            toast({
                title: 'Connection Failed',
                description: decodeURIComponent(message),
                variant: 'destructive',
            });
            // No need to call fetchCredentials() here, let selection handle it
        }
        if (connectStatus === 'success') {
             toast({
                title: 'Connection Successful',
                description: 'Your YouTube account has been connected successfully.',
            });
            fetchCredentials();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, toast]);

    
    const handleConnect = async (credentialSet: CredentialSet) => {
        const { id } = credentialSet;
        const result = await getGoogleAuthUrlAction(id);
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
    
    const handleFormSave = useCallback(() => {
        setEditingSet(null);
        toast({
            title: 'Success',
            description: 'Credential set saved successfully.',
        });
        fetchCredentials();
    }, [fetchCredentials, toast]);

    const handleDelete = async (id: number) => {
        const result = await deleteCredentialSetAction(id);
        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) {
            if (selectedCredentialSet?.id === id) {
                onCredentialSelect(null);
            }
            fetchCredentials();
        }
    }

    const renderCredentialList = () => {
        if (isLoading) {
             return (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            )
        }

        if (credentialSets.length === 0) {
            return (
                 <Alert className="text-center py-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="mb-2">No Credentials Found</AlertTitle>
                    <AlertDescription>You have no saved credentials. Use the form above to get started.</AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="space-y-2">
                 <h3 className="text-lg font-semibold leading-none tracking-tight">Saved Credentials</h3>
                {selectedCredentialSet ? (
                    <Alert variant="default" className="border-primary/50">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <AlertTitle>Credential Set Selected</AlertTitle>
                        <AlertDescription>
                            You are using <span className="font-semibold">"{selectedCredentialSet.credentialName}"</span>. You can now proceed to the next step.
                        </AlertDescription>
                    </Alert>
                ) : (
                     <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Please expand and select a credential set from the list below to continue.</AlertDescription>
                    </Alert>
                )}
                 <Accordion type="single" collapsible className="w-full" value={selectedCredentialSet?.id.toString()} onValueChange={(value) => {
                        const newSet = credentialSets.find(s => s.id.toString() === value) || null;
                        onCredentialSelect(newSet);
                    }}>
                        {credentialSets.map(set => (
                             <AccordionItem value={set.id.toString()} key={set.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 flex-1">
                                        <span>{set.credentialName}</span>
                                        {set.isConnected ? (
                                            <Badge variant="default" className="bg-green-600/20 text-green-700 border-green-600/30 hover:bg-green-600/30"><CheckCircle className="h-3 w-3 mr-1" /> Connected</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-amber-600/10 text-amber-700 border-amber-600/20 hover:bg-amber-600/20"><AlertCircle className="h-3 w-3 mr-1" /> Not Connected</Badge>
                                        )}
                                    </div>
                                     <div className="flex items-center gap-2 mr-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={(e) => { e.stopPropagation(); setEditingSet(set); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the "{set.credentialName}" credential set and all associated campaign data. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <form onSubmit={(e) => { e.preventDefault(); handleDelete(set.id); }}>
                                                        <DeleteButton />
                                                    </form>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 rounded-lg border bg-background/50 p-4">
                                        <Alert variant="default">
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>What's the difference?</AlertTitle>
                                            <AlertDescription>
                                                Your **API Key** allows our app to search for public channels and videos (read-only access). Connecting your **Google Account** (via OAuth) grants us permission to post comments *on your behalf* (write access). Both are required.
                                            </AlertDescription>
                                        </Alert>
                                        {set.isConnected ? (
                                             <div className="space-y-3">
                                                <Alert variant="default" className="border-green-500/50">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <AlertTitle>Account Connected</AlertTitle>
                                                    <AlertDescription>
                                                        This credential set is authorized to post comments. If you change credentials, you must reconnect.
                                                    </AlertDescription>
                                                </Alert>
                                                 <Button onClick={() => handleConnect(set)}>
                                                    <Youtube className="mr-2" />
                                                    Reconnect Account
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Action Required: Connect Account</AlertTitle>
                                                    <AlertDescription>
                                                        You must connect this credential set to your Google Account to grant permission for posting comments.
                                                    </AlertDescription>
                                                </Alert>
                                                <Button onClick={() => handleConnect(set)}>
                                                    <Youtube className="mr-2" />
                                                    Connect YouTube Account
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
            </div>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Step 1: Manage & Select Credentials</CardTitle>
                <CardDescription>Add or edit your API credentials below, then select a set to use for this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <CredentialSetForm 
                    onSave={handleFormSave} 
                    credentialSet={editingSet} 
                    onClear={() => setEditingSet(null)}
                />

                <Separator />
                
                {renderCredentialList()}

            </CardContent>
        </Card>
    );
}

export function CredentialManager(props: CredentialManagerProps) {
    return (
        <Suspense fallback={
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
        }>
            <CredentialManagerInternal {...props} />
        </Suspense>
    )
}

    