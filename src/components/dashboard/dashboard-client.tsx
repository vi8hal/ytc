
'use client';

import { useState } from 'react';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';
import { DashboardStepper } from './dashboard-stepper';
import type { CredentialSet } from '@/lib/actions/credentials';
import { CampaignHistory } from './campaign-history';

export type Video = { id: string; title: string; channelId: string; channelTitle: string; };
export type Channel = { id: string; name: string; thumbnail: string; };
export type Campaign = {
    id: number;
    createdAt: string;
    credentialName: string;
    eventCount: string;
}

export function DashboardClient({ campaigns }: { campaigns: Campaign[] }) {
  const [selectedCredentialSet, setSelectedCredentialSet] = useState<CredentialSet | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignOutput['results'] | null>(null);

  const handleSetChannels = (channels: Channel[]) => {
    setSelectedChannels(channels);
    setSelectedVideos([]); // Reset video selection when channels change
    setCampaignResults(null);
  };

  const handleCampaignComplete = (results: CampaignOutput['results']) => {
    setCampaignResults(results);
    // Reset selections after campaign
    setSelectedChannels([]);
    setSelectedVideos([]);
  };
  
  const handleCredentialSelect = (credential: CredentialSet | null) => {
    setSelectedCredentialSet(credential);
    // Reset everything downstream if credentials change
    handleSetChannels([]);
  }

  return (
    <div className="space-y-8">
        <DashboardStepper
            selectedCredentialSet={selectedCredentialSet}
            onCredentialSelect={handleCredentialSelect}
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

      {campaigns && campaigns.length > 0 && (
        <>
            <Separator className="my-8" />
            <CampaignHistory campaigns={campaigns} />
        </>
      )}
    </div>
  );
}
