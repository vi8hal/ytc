'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Video } from './dashboard-client';

interface VideoSelectionProps {
  videos: Video[];
  selectedVideos: Video[];
  onSelectedVideosChange: (videos: Video[]) => void;
}

export function VideoSelection({ videos, selectedVideos, onSelectedVideosChange }: VideoSelectionProps) {
  const handleSelectVideo = (video: Video, checked: boolean) => {
    if (checked) {
      onSelectedVideosChange([...selectedVideos, video]);
    } else {
      onSelectedVideosChange(selectedVideos.filter((v) => v.id !== video.id));
    }
  };

  const isAllSelected = selectedVideos.length > 0 && selectedVideos.length === videos.length;
  const isSomeSelected = selectedVideos.length > 0 && selectedVideos.length < videos.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedVideosChange(videos);
    } else {
      onSelectedVideosChange([]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 2: Select Videos</CardTitle>
        <CardDescription>Choose the videos you want to shuffle comments on.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              aria-label="Select all videos"
              data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
            />
            <Label htmlFor="select-all" className="font-semibold flex-1 cursor-pointer">
              Select all videos ({selectedVideos.length} / {videos.length})
            </Label>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={video.id}
                  checked={selectedVideos.some((v) => v.id === video.id)}
                  onCheckedChange={(checked) => handleSelectVideo(video, Boolean(checked))}
                />
                <Label htmlFor={video.id} className="flex-1 cursor-pointer">
                  {video.title}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
