
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Hash, KeyRound, Loader2, Mail, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { resetPasswordAction } from '@/lib/actions/password';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Resetting Password...
        </>
      ) : (
        <>
          Reset Password
          <ArrowRight className="ml-2" />
        </>
      )}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your email, the code we sent you, and your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
                <Alert variant="destructive">
                    <AlertTitle>Reset Failed</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}
             <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="name@example.com" required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="otp" name="otp" placeholder="123456" required className="pl-10" />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pl-10 pr-10" minLength={8} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
               <p className="text-xs text-muted-foreground">
                Must be 8+ characters and include an uppercase, lowercase, number, and special character.
               </p>
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2">
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
