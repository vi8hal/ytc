
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runCampaignAction } from '@/lib/actions/campaign';
import { useToast } from '@/hooks/use-toast';
import type { Video } from './dashboard-client';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import type { CredentialSet } from '@/lib/actions/credentials';

interface CommentFormProps {
  credentialSet: CredentialSet | null;
  selectedVideos: Video[];
  onCampaignComplete: (results: CampaignOutput['results']) => void;
  disabled?: boolean;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Campaign...
        </>
      ) : (
        <>
          <Bot className="mr-2 h-4 w-4" />
          Run Campaign
        </>
      )}
    </Button>
  );
}

export function CommentForm({ credentialSet, selectedVideos, onCampaignComplete, disabled = false }: CommentFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const initialState = { data: null, error: null, message: null };
  const [state, formAction] = useActionState(runCampaignAction, initialState);

  const isFormDisabled = disabled || selectedVideos.length === 0;

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 4: Add & Send Comments</CardTitle>
        <CardDescription>
          Enter up to 4 comments. The AI will randomly pick one to post on each selected video.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="videoIds" value={selectedVideos.map(v => v.id).join(',')} />
          <input type="hidden" name="credentialId" value={credentialSet?.id ?? ''} />
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`comment${i}`}>Comment #{i}</Label>
              <Textarea
                id={`comment${i}`}
                name={`comment${i}`}
                placeholder={`Your brilliant comment #${i}...`}
                rows={3}
                required
                disabled={isFormDisabled}
              />
            </div>
          ))}

          <SubmitButton disabled={isFormDisabled} />
          {disabled && (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please select a video in Step 3 to enable this form.</AlertDescription>
            </Alert>
          )}
          {selectedVideos.length === 0 && !disabled && (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please select at least one video in Step 3 to enable this form.</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
