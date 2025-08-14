
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { CheckCircle2 } from 'lucide-react';

interface ResultsTimelineProps {
  results: ShuffleCommentsOutput['results'];
}

export function ResultsTimeline({ results }: ResultsTimelineProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
            <CheckCircle2 className="text-green-500" />
            Campaign Complete: Results
        </CardTitle>
        <CardDescription>
          Here's a visualization of when each comment was sent within the 10-minute window.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="relative w-full">
          {/* Timeline Bar */}
          <div className="h-2 w-full rounded-full bg-muted" />
          
          {/* Timeline Markers */}
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span>00:00</span>
            <span>02:30</span>
            <span>05:00</span>
            <span>07:30</span>
            <span>10:00</span>
          </div>

          {/* Comment Points */}
          <div className="absolute top-0 left-0 h-full w-full">
            {results.map((result, index) => (
              <TooltipProvider key={index} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-[4px] -translate-x-1/2 cursor-pointer"
                      style={{ left: `${(result.timestamp / 600) * 100}%` }}
                    >
                      <div className="h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/20 transition-transform hover:scale-125" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-left shadow-lg">
                    <p className="font-bold text-sm">
                        Comment Sent
                    </p>
                     <p className="mt-1 text-muted-foreground">"{result.commentSent}"</p>
                    <hr className="my-2" />
                    <p className="text-xs">
                        <span className="font-semibold">Video ID:</span> <span className="font-mono">{result.videoId}</span>
                    </p>
                    <p className="text-xs">
                        <span className="font-semibold">Time:</span> <span className="font-mono">{formatTime(result.timestamp)}</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
