
// This component has been replaced by the new CredentialManager component.
// It is no longer used in the application and can be safely deleted.

'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2, Save, Terminal, AlertCircle, CheckCircle, Youtube } from 'lucide-react';
import { updateApiKeyAction } from '@/lib/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function ApiKeySetup() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Component Deprecated</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                       This component (ApiKeySetup) has been replaced by the new CredentialManager.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
