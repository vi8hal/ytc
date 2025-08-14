'use client';

import { useState, useEffect } from 'react';
import type { ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { getChannelVideos } from '@/lib/actions';

export type Video = { id: string; title: string };
export type Channel = { id: string; name: string };

export function DashboardClient() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [shuffleResults, setShuffleResults] = useState<ShuffleCommentsOutput['results'] | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!selectedChannel) {
        setVideos([]);
        return;
      }
      setIsLoadingVideos(true);
      try {
        const channelVideos = await getChannelVideos(selectedChannel.id);
        setVideos(channelVideos);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [selectedChannel]);

  const handleChannelSelect = (channel: Channel | null) => {
    setSelectedChannel(channel);
    setSelectedVideos([]);
    setShuffleResults(null);
  };

  const handleShuffleComplete = (results: ShuffleCommentsOutput['results']) => {
    setShuffleResults(results);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <ChannelSearch
            onChannelSelect={handleChannelSelect}
            selectedChannel={selectedChannel}
        />
        {selectedChannel && (
          <VideoSelection
            key={selectedChannel.id}
            videos={videos}
            isLoading={isLoadingVideos}
            selectedVideos={selectedVideos}
            onSelectedVideosChange={setSelectedVideos}
          />
        )}
      </div>
      <div className="lg:col-span-1 space-y-8">
        <CommentForm 
            selectedVideos={selectedVideos}
            onShuffleComplete={handleShuffleComplete}
        />
      </div>
      
      {shuffleResults && shuffleResults.length > 0 && (
        <div className="lg:col-span-3">
            <Separator className="my-8" />
            <ResultsTimeline results={shuffleResults} />
        </div>
      )}
    </div>
  );
}
