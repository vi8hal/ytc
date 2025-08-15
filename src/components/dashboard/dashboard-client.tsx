
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { getChannelVideos, getApiKeyAction } from '@/lib/actions';
import { ApiKeySetup } from './api-key-setup';
import { useToast } from '@/hooks/use-toast';

export type Video = { id: string; title: string; channelId: string; channelTitle: string; };
export type Channel = { id: string; name: string; thumbnail: string; };

export function DashboardClient() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [shuffleResults, setShuffleResults] = useState<ShuffleCommentsOutput['results'] | null>(null);

  const fetchApiKey = useCallback(async () => {
    setIsApiKeyLoading(true);
    try {
      const result = await getApiKeyAction();
      if (result?.apiKey) {
          setApiKey(result.apiKey);
      } else if (result?.error) {
          console.log("No API key found or error fetching it:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch API key", error);
      toast({ title: 'Error', description: 'An unexpected error occurred while fetching your API key.', variant: 'destructive' });
    } finally {
      setIsApiKeyLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);


  useEffect(() => {
    const fetchVideos = async () => {
      if (selectedChannels.length === 0 || !apiKey) {
        setVideos([]);
        return;
      }
      setIsLoadingVideos(true);
      setVideoError(null);
      setVideos([]);
      setSelectedVideos([]);
      try {
        const videoPromises = selectedChannels.map(channel => getChannelVideos(channel.id));
        const allChannelVideos = await Promise.all(videoPromises);
        
        const videosWithChannelInfo = allChannelVideos.flatMap((channelVideos, index) => {
            const channel = selectedChannels[index];
            return channelVideos.map(video => ({
                ...video,
                channelId: channel.id,
                channelTitle: channel.name,
            }))
        });

        setVideos(videosWithChannelInfo);
      } catch (error: any) {
        console.error("Failed to fetch videos:", error);
        setVideoError(error.message || 'An unknown error occurred.');
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [selectedChannels, apiKey]);

  const handleSetChannels = (channels: Channel[]) => {
    setSelectedChannels(channels);
    // Reset downstream state
    setVideos([]);
    setSelectedVideos([]);
    setShuffleResults(null);
    setVideoError(null);
  };

  const handleShuffleComplete = (results: ShuffleCommentsOutput['results']) => {
    setShuffleResults(results);
  };
  
  const handleApiKeyUpdate = (newApiKey: string) => {
    setApiKey(newApiKey);
    // Reset downstream state
    handleSetChannels([]);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <ApiKeySetup 
            currentApiKey={apiKey} 
            onApiKeyUpdate={handleApiKeyUpdate} 
            isLoading={isApiKeyLoading} 
        />

        <ChannelSearch
            onChannelsChange={handleSetChannels}
            selectedChannels={selectedChannels}
            disabled={!apiKey || isApiKeyLoading}
        />
        
        <VideoSelection
          key={selectedChannels.map(c => c.id).join('-')}
          videos={videos}
          channels={selectedChannels}
          isLoading={isLoadingVideos}
          selectedVideos={selectedVideos}
          onSelectedVideosChange={setSelectedVideos}
          disabled={selectedChannels.length === 0}
          error={videoError}
        />
      </div>
      <div className="lg:col-span-1 space-y-8 sticky top-24">
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
