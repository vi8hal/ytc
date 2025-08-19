
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, KeyRound, Loader2, Mail, User } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/google';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { signUpAction } from '@/lib/actions/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Creating Account...
        </>
      ) : (
        <>
          Create Account with Email
          <ArrowRight className="ml-2" />
        </>
      )}
    </Button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUpAction, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>Join ChronoComment to supercharge your YouTube presence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state?.error && (
              <Alert variant="destructive">
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
              </Alert>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" name="name" placeholder="Your Name" required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="name@example.com" required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type="password" required className="pl-10" minLength={8} />
              </div>
               <p className="text-xs text-muted-foreground">
                Must be 8+ characters and include an uppercase, lowercase, number, and special character.
               </p>
            </div>
            <SubmitButton />
          </form>
          <p className="mt-4 px-2 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
