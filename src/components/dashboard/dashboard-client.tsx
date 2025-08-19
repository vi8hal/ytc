
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { getAppSettingsAction } from '@/lib/actions/settings';
import { useToast } from '@/hooks/use-toast';
import { DashboardStepper } from './dashboard-stepper';

export type Video = { id: string; title: string; channelId: string; channelTitle: string; };
export type Channel = { id: string; name: string; thumbnail: string; };

export function DashboardClient() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [areSettingsLoading, setAreSettingsLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
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
          toast({ title: 'Error', description: 'Could not fetch your settings. Please refresh.', variant: 'destructive' });
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

  const handleSetChannels = (channels: Channel[]) => {
    setSelectedChannels(channels);
    setSelectedVideos([]);
    setCampaignResults(null);
  };

  const handleCampaignComplete = (results: CampaignOutput['results']) => {
    setCampaignResults(results);
    // Reset selections after campaign
    setSelectedChannels([]);
    setSelectedVideos([]);
  };
  
  const handleCredentialsUpdate = () => {
    fetchAppSettings();
    handleSetChannels([]);
  }

  return (
    <div className="space-y-8">
        <DashboardStepper
            apiKey={apiKey}
            isYouTubeConnected={isYouTubeConnected}
            areSettingsLoading={areSettingsLoading}
            onCredentialsUpdate={handleCredentialsUpdate}
            selectedChannels={selectedChannels}
            onChannelsChange={handleSetChannels}
            selectedVideos={selectedVideos}
            onSelectedVideosChange={setSelectedVideos}
            onCampaignComplete={handleCampaignComplete}
        />
      
      {campaignResults && campaignResults.length > 0 && (
        <>
            <Separator className="my-8" />
            <ResultsTimeline results={campaignResults} />
        </>
      )}
    </div>
  );
}
