
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Video, Channel } from './dashboard-client';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const MAX_VIDEOS = 10;

interface VideoSelectionProps {
  videos: Video[];
  channels: Channel[];
  isLoading: boolean;
  selectedVideos: Video[];
  onSelectedVideosChange: (videos: Video[]) => void;
  disabled?: boolean;
  error?: string | null;
}

export function VideoSelection({ videos, channels, isLoading, selectedVideos, onSelectedVideosChange, disabled = false, error = null }: VideoSelectionProps) {
  const handleSelectVideo = (video: Video, checked: boolean) => {
    if (checked) {
      if (selectedVideos.length < MAX_VIDEOS) {
        onSelectedVideosChange([...selectedVideos, video]);
      }
    } else {
      onSelectedVideosChange(selectedVideos.filter((v) => v.id !== video.id));
    }
  };

  const isAllSelected = !isLoading && videos.length > 0 && selectedVideos.length === Math.min(videos.length, MAX_VIDEOS);
  const isSomeSelected = selectedVideos.length > 0 && !isAllSelected;
  const atVideoLimit = selectedVideos.length >= MAX_VIDEOS;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedVideosChange(videos.slice(0, MAX_VIDEOS));
    } else {
      onSelectedVideosChange([]);
    }
  }

  const renderContent = () => {
    if (disabled) {
      return (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please select a channel in Step 2 to see its videos.</AlertDescription>
        </Alert>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (videos.length === 0) {
      return (
        <p className="text-center text-muted-foreground text-sm py-8">No videos found for the selected channels.</p>
      );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors border">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                aria-label="Select all videos"
                data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                disabled={isLoading || videos.length === 0}
              />
              <Label htmlFor="select-all" className="font-semibold flex-1 cursor-pointer text-sm">
                Select up to {MAX_VIDEOS} videos ({selectedVideos.length} / {MAX_VIDEOS})
              </Label>
            </div>
            {atVideoLimit && (
              <Alert variant="default" className="border-primary/50">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>You have reached the maximum of {MAX_VIDEOS} videos for this campaign.</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2 border rounded-md">
                <Accordion type="multiple" className="w-full" defaultValue={channels.map(c => c.id)}>
                    {channels.map(channel => {
                        const channelVideos = videos.filter(v => v.channelId === channel.id);
                        if (channelVideos.length === 0) return null;
                        return (
                            <AccordionItem value={channel.id} key={channel.id}>
                                <AccordionTrigger className="p-2 font-semibold hover:no-underline hover:bg-muted/50 rounded-md">
                                    {channel.name} ({channelVideos.length} videos)
                                </AccordionTrigger>
                                <AccordionContent className="p-1">
                                    <div className="space-y-1 pl-2">
                                    {channelVideos.map((video) => {
                                      const isChecked = selectedVideos.some((v) => v.id === video.id);
                                      return (
                                        <div
                                            key={video.id}
                                            className={cn("flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors", {
                                               'opacity-50 cursor-not-allowed': atVideoLimit && !isChecked,
                                            })}
                                        >
                                            <Checkbox
                                            id={video.id}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => handleSelectVideo(video, Boolean(checked))}
                                            disabled={atVideoLimit && !isChecked}
                                            />
                                            <Label htmlFor={video.id} className={cn("flex-1 cursor-pointer text-sm font-normal", {
                                               'cursor-not-allowed': atVideoLimit && !isChecked,
                                            })}>
                                            {video.title}
                                            </Label>
                                        </div>
                                      )
                                    })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
          </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 3: Select Videos</CardTitle>
        <CardDescription>Choose the videos you want the AI to comment on (up to a maximum of 10).</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
