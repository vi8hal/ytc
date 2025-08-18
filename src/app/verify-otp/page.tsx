
'use client';

import { useActionState, useEffect, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Hash, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { verifyOtpAction, resendOtpAction } from '@/lib/actions/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          Verify Account
          <ArrowRight className="ml-2" />
        </>
      )}
    </Button>
  );
}

function ResendButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="link" className="p-0 h-auto" type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" />
                    Sending...
                </>
            ) : "Resend code" }
        </Button>
    )
}

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');
  const [verifyState, verifyFormAction] = useActionState(verifyOtpAction, { error: null });
  const { toast } = useToast();

  const handleResendAction = async (formData: FormData) => {
    const email = formData.get('email') as string;
    if (!email) {
        toast({ title: 'Error', description: 'Email is missing.', variant: 'destructive'});
        return;
    }
    const result = await resendOtpAction(email);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.success) {
      toast({
        title: 'Success',
        description: result.success,
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Check Your Email</CardTitle>
          <CardDescription>We've sent a 6-digit code to you. Please enter it below to verify your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={verifyFormAction} className="space-y-4">
            {verifyState?.error && (
                <Alert variant="destructive">
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>{verifyState.error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        required 
                        className="pl-10" 
                        defaultValue={emailFromQuery ?? ''}
                        readOnly={!!emailFromQuery}
                    />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="otp" name="otp" placeholder="123456" required className="pl-10" />
              </div>
            </div>
            <VerifyButton />
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">Didn't receive a code?</p>
            <form action={handleResendAction}>
                <input type="hidden" name="email" value={emailFromQuery ?? ''} />
                <ResendButton />
            </form>
        </CardFooter>
      </Card>
  )
}


export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
