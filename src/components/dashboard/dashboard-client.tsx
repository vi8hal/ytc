
'use client';

import { useState, useEffect } from 'react';
import type { ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { getChannelVideos, getApiKeyAction } from '@/lib/actions';
import { ApiKeySetup } from './api-key-setup';

export type Video = { id: string; title: string };
export type Channel = { id: string; name: string };

export function DashboardClient() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [shuffleResults, setShuffleResults] = useState<ShuffleCommentsOutput['results'] | null>(null);

  useEffect(() => {
    async function fetchApiKey() {
      try {
        const result = await getApiKeyAction();
        if (result.apiKey) {
            setApiKey(result.apiKey);
        }
      } catch (error) {
        console.error("Failed to fetch API key", error);
      } finally {
        setIsApiKeyLoading(false);
      }
    }
    fetchApiKey();
  }, []);


  useEffect(() => {
    const fetchVideos = async () => {
      if (!selectedChannel || !apiKey) {
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
  }, [selectedChannel, apiKey]);

  const handleChannelSelect = (channel: Channel | null) => {
    setSelectedChannel(channel);
    setSelectedVideos([]);
    setShuffleResults(null);
  };

  const handleShuffleComplete = (results: ShuffleCommentsOutput['results']) => {
    setShuffleResults(results);
  };
  
  const handleApiKeyUpdate = (newApiKey: string) => {
    setApiKey(newApiKey);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <ApiKeySetup currentApiKey={apiKey} onApiKeyUpdate={handleApiKeyUpdate} isLoading={isApiKeyLoading} />

        <ChannelSearch
            onChannelSelect={handleChannelSelect}
            selectedChannel={selectedChannel}
            disabled={!apiKey}
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
