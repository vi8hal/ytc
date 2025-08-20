
'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, KeyRound, Loader2, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { signUpAction } from '@/lib/actions/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [state, formAction] = useActionState(signUpAction, { error: null, showVerificationLink: false, email: null });
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // When the action returns a specific email, update the local state
  useEffect(() => {
    if (state?.email && !email) {
      setEmail(state.email);
    }
  }, [state?.email, email]);

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
              <Alert variant={state.showVerificationLink ? 'default' : 'destructive'} className={state.showVerificationLink ? 'border-primary/50' : ''}>
                  {state.showVerificationLink ? <ShieldCheck className="h-4 w-4" /> : null}
                  <AlertTitle>{state.showVerificationLink ? 'Account Exists' : 'Registration Failed'}</AlertTitle>
                  <AlertDescription>
                    {state.error}
                    {state.showVerificationLink && state.email && (
                         <Link href={`/verify-otp?email=${encodeURIComponent(state.email)}`} className="font-bold text-primary hover:underline underline-offset-4 ml-1">
                            Click here to verify.
                        </Link>
                    )}
                  </AlertDescription>
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
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="pl-10"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
