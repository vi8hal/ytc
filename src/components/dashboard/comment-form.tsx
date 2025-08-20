
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface CommentFormProps {
  onCommentsChange: (comments: string[]) => void;
  disabled?: boolean;
}

export function CommentForm({ onCommentsChange, disabled = false }: CommentFormProps) {
  const [comments, setComments] = useState<string[]>(['', '', '', '']);

  const handleCommentChange = (index: number, value: string) => {
    const newComments = [...comments];
    newComments[index] = value;
    setComments(newComments);
    onCommentsChange(newComments);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 4: Add Comments</CardTitle>
        <CardDescription>
          Enter exactly 4 comments. The AI will randomly pick one to post on each selected video.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`comment${i}`}>Comment #{i + 1}</Label>
              <Textarea
                id={`comment${i}`}
                name={`comment${i}`}
                placeholder={`Your brilliant comment #${i + 1}...`}
                rows={3}
                required
                disabled={disabled}
                value={comments[i]}
                onChange={(e) => handleCommentChange(i, e.target.value)}
              />
            </div>
          ))}

          {disabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please select at least one video in Step 3 to add comments.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
