
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

interface DashboardClientProps {
    initialCampaigns: Campaign[];
    initialCredentialSets: CredentialSet[];
}

export function DashboardClient({ initialCampaigns, initialCredentialSets }: DashboardClientProps) {
  const [credentialSets, setCredentialSets] = useState<CredentialSet[]>(initialCredentialSets);
  const [selectedCredentialSet, setSelectedCredentialSet] = useState<CredentialSet | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<string[]>(['', '', '', '']);
  const [campaignResults, setCampaignResults] = useState<CampaignOutput['results'] | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>(initialCampaigns);

  const handleSetChannels = (channels: Channel[]) => {
    setSelectedChannels(channels);
    setSelectedVideos([]); // Reset video selection when channels change
    setCampaignResults(null);
  };

  const handleCampaignComplete = (results: CampaignOutput['results']) => {
    setCampaignResults(results);
    // Refresh campaign history
    const { getCampaignHistory } = require('@/lib/actions/campaign');
    getCampaignHistory().then(setCampaignHistory);
    // Reset selections for the next campaign
    setSelectedChannels([]);
    setSelectedVideos([]);
    setComments(['', '', '', '']);
  };
  
  const handleCredentialSelect = (credential: CredentialSet | null) => {
    setSelectedCredentialSet(credential);
    // Reset everything downstream if credentials change
    handleSetChannels([]);
  }
  
  const handleCredentialsUpdate = (sets: CredentialSet[]) => {
    setCredentialSets(sets);
    if (selectedCredentialSet) {
        const updatedSelected = sets.find(s => s.id === selectedCredentialSet.id) || null;
        setSelectedCredentialSet(updatedSelected);
    }
  }

  return (
    <div className="space-y-8">
        <DashboardStepper
            initialCredentialSets={credentialSets}
            onCredentialsUpdate={handleCredentialsUpdate}
            selectedCredentialSet={selectedCredentialSet}
            onCredentialSelect={handleCredentialSelect}
            selectedChannels={selectedChannels}
            onChannelsChange={handleSetChannels}
            selectedVideos={selectedVideos}
            onSelectedVideosChange={setSelectedVideos}
            comments={comments}
            onCommentsChange={setComments}
            onCampaignComplete={handleCampaignComplete}
        />
      
      {campaignResults && campaignResults.length > 0 && (
        <>
            <Separator className="my-8" />
            <ResultsTimeline results={campaignResults} />
        </>
      )}

      {campaignHistory && campaignHistory.length > 0 && (
        <>
            <Separator className="my-8" />
            <CampaignHistory campaigns={campaignHistory} />
        </>
      )}
    </div>
  );
}
