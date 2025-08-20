
'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { runCampaignAction } from '@/lib/actions/campaign';
import { useToast } from '@/hooks/use-toast';
import type { Video, Channel } from './dashboard-client';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { Bot, Loader2, AlertCircle, CheckCircle, MessageSquare, Youtube, Target } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { CredentialSet } from '@/lib/actions/credentials';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface CampaignReviewProps {
  credentialSet: CredentialSet | null;
  selectedChannels: Channel[];
  selectedVideos: Video[];
  comments: string[];
  onCampaignComplete: (results: CampaignOutput['results']) => void;
  disabled?: boolean;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Launching Campaign... This may take a moment.
        </>
      ) : (
        <>
          <Bot className="mr-2 h-4 w-4" />
          Confirm & Launch Campaign
        </>
      )}
    </Button>
  );
}

export function CampaignReview({ 
    credentialSet, 
    selectedChannels, 
    selectedVideos, 
    comments, 
    onCampaignComplete, 
    disabled = false 
}: CampaignReviewProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const initialState = { data: null, error: null, message: null };
  const isLaunchDisabled = disabled || !credentialSet?.isConnected;
  
  // The action needs all the data, so we'll pass it via hidden inputs
  const runCampaignActionWithData = runCampaignAction.bind(
      null, 
      credentialSet?.id ?? -1,
      selectedVideos.map(v => v.id),
      comments
  );
  const [state, formAction] = useActionState(runCampaignActionWithData, initialState);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.error ? 'Error' : 'Success',
        description: state.message,
        variant: state.error ? 'destructive' : 'default',
      });
    }
    if (!state.error && state.data?.results) {
      onCampaignComplete(state.data.results);
      formRef.current?.reset();
    }
  }, [state, toast, onCampaignComplete]);

  if (disabled) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Step 5: Review & Launch</CardTitle>
                <CardDescription>
                Confirm your campaign details before launching.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Please complete all previous steps to review your campaign.</AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 5: Review & Launch</CardTitle>
        <CardDescription>
          You're all set! Please review your campaign configuration below. When you're ready, hit launch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!credentialSet?.isConnected && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Account Not Connected</AlertTitle>
                <AlertDescription>
                    You must connect the selected credential set to your Google Account before you can launch a campaign. Please go back to Step 1 to connect it.
                </AlertDescription>
            </Alert>
        )}
        <div className="space-y-4 rounded-lg border bg-background/50 p-4">
            <h3 className="flex items-center gap-2 font-semibold"><CheckCircle className="h-5 w-5 text-primary"/>Configuration Summary</h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-muted-foreground">Credential Set:</span>
                <Badge variant="secondary">{credentialSet?.credentialName}</Badge>
            </div>
            
            <Separator />
            
            <div>
                <span className="font-medium text-muted-foreground flex items-center gap-2 mb-2"><Target className="h-4 w-4" />Targeted Channels ({selectedChannels.length}):</span>
                <div className="flex flex-wrap gap-2">
                    {selectedChannels.map(c => <Badge key={c.id} variant="outline">{c.name}</Badge>)}
                </div>
            </div>

            <Separator />

             <div>
                <span className="font-medium text-muted-foreground flex items-center gap-2 mb-2"><Youtube className="h-4 w-4" />Targeted Videos ({selectedVideos.length}):</span>
                <ul className="list-disc list-inside text-sm text-foreground space-y-1 max-h-40 overflow-y-auto">
                    {selectedVideos.map(v => <li key={v.id}>{v.title}</li>)}
                </ul>
            </div>

            <Separator />

            <div>
                 <span className="font-medium text-muted-foreground flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4" />Comments to be Shuffled ({comments.length}):</span>
                 <div className="space-y-2">
                    {comments.map((comment, i) => (
                        <blockquote key={i} className="border-l-2 pl-3 text-sm italic text-foreground">
                            {comment}
                        </blockquote>
                    ))}
                 </div>
            </div>
        </div>
        
        <form ref={formRef} action={formAction}>
          <SubmitButton disabled={isLaunchDisabled} />
        </form>

      </CardContent>
    </Card>
  );
}
