
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { useEffect } from 'react';
import { GoogleIcon } from '@/components/icons/google';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { forgotPasswordAction } from '@/lib/actions/password';
import { Separator } from '@/components/ui/separator';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          Send Reset Code
          <ArrowRight className="ml-2" />
        </>
      )}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, { message: null, error: null });
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.error ? 'An error occurred' : 'Request Sent',
        description: state.message,
        variant: state.error ? 'destructive' : 'default',
      });
    }
  }, [state, toast]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Forgot Your Password?</CardTitle>
          <CardDescription>No worries. Enter your email and we'll send you a 6-digit reset code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Button variant="outline" className="w-full">
                <GoogleIcon className="mr-2 size-5" />
                Continue with Google
            </Button>

            <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>
            
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="name@example.com" required className="pl-10" />
              </div>
            </div>
            <SubmitButton />
          </form>
           <p className="mt-4 text-center text-sm text-muted-foreground">
            Received a code?{' '}
            <Link href="/reset-password" className="font-medium text-primary hover:underline underline-offset-4">
              Reset your password
            </Link>
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
