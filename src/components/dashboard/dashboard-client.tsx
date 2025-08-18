
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { getChannelVideos } from '@/lib/actions/youtube';
import { getAppSettingsAction } from '@/lib/actions/settings';
import { ApiKeySetup } from './api-key-setup';
import { useToast } from '@/hooks/use-toast';

export type Video = { id: string; title: string; channelId: string; channelTitle: string; };
export type Channel = { id: string; name: string; thumbnail: string; };

export function DashboardClient() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [areSettingsLoading, setAreSettingsLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignOutput['results'] | null>(null);

  const fetchAppSettings = useCallback(async () => {
    setAreSettingsLoading(true);
    try {
      const result = await getAppSettingsAction();
      if (result.settings) {
          setApiKey(result.settings.apiKey);
          setIsYouTubeConnected(result.settings.isYouTubeConnected);
      } else if (result.error) {
          console.error("Error fetching app settings:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch app settings", error);
      toast({ title: 'Error', description: 'An unexpected error occurred while fetching your settings.', variant: 'destructive' });
    } finally {
      setAreSettingsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppSettings();
  }, [fetchAppSettings]);

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
    setVideos([]);
    setSelectedVideos([]);
    setCampaignResults(null);
    setVideoError(null);
  };

  const handleCampaignComplete = (results: CampaignOutput['results']) => {
    setCampaignResults(results);
  };
  
  const handleCredentialsUpdate = () => {
    fetchAppSettings();
    handleSetChannels([]);
  }

  const handleYouTubeConnectionUpdate = (isConnected: boolean) => {
    setIsYouTubeConnected(isConnected);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <ApiKeySetup 
            currentApiKey={apiKey} 
            isYouTubeConnected={isYouTubeConnected}
            onCredentialsUpdate={handleCredentialsUpdate} 
            onYouTubeConnectionUpdate={handleYouTubeConnectionUpdate}
            isLoading={areSettingsLoading} 
        />

        <ChannelSearch
            onChannelsChange={handleSetChannels}
            selectedChannels={selectedChannels}
            disabled={!apiKey || areSettingsLoading}
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
            onCampaignComplete={handleCampaignComplete}
            disabled={!isYouTubeConnected}
        />
      </div>
      
      {campaignResults && campaignResults.length > 0 && (
        <div className="lg:col-span-3">
            <Separator className="my-8" />
            <ResultsTimeline results={campaignResults} />
        </div>
      )}
    </div>
  );
}
