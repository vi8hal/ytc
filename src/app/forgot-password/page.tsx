'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { forgotPasswordAction } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending...' : 'Send Reset Link'}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, { message: null });
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: 'Request Sent',
        description: state.message,
      });
    }
  }, [state, toast]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Forgot Your Password?</CardTitle>
          <CardDescription>No worries. Enter your email and we'll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="name@example.com" required className="pl-10" />
              </div>
            </div>
            <SubmitButton />
          </form>
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
