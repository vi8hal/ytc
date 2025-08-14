
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRight, Hash, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { verifyOtpAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
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

export default function VerifyOtpPage() {
  const [state, formAction] = useActionState(verifyOtpAction, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Check Your Email</CardTitle>
          <CardDescription>We've sent a 6-digit code to you. Please enter it below to verify your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
                <Alert variant="destructive">
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="otp" name="otp" placeholder="123456" required className="pl-10" />
              </div>
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">Didn't receive a code?</p>
            <Button variant="link" className="p-0 h-auto">Resend code</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
