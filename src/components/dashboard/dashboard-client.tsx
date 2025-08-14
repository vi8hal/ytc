'use client';

import { useState } from 'react';
import type { ShuffleCommentsOutput } from '@/ai/flows/shuffle-comments';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { ResultsTimeline } from './results-timeline';
import { Separator } from '@/components/ui/separator';

// Mock data
const mockChannels = [
  { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', name: 'Google for Developers' },
  { id: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship' },
  { id: 'UClb90NQQcskPUGDIXsQEz5Q', name: 'freeCodeCamp.org' },
  { id: 'UC-8QAzbLcRglXeN_MY9blyw', name: 'Nerdforge' },
];

const mockVideos = {
  'UC_x5XG1OV2P6uZZ5FSM9Ttw': [
    { id: 'GDPA0xQZc68', title: 'What\'s new in Android | Google I/O 2024' },
    { id: '7o2_2Q28sGA', title: 'What’s new for the web platform | Google I/O 2024' },
    { id: 'vIuY3e8Jt-A', title: 'What\'s new in Gemini | Google I/O 2024' },
  ],
  'UCsBjURrPoezykLs9EqgamOA': [
    { id: '2hM5T_3Nsrw', title: 'The Next.js App Router will replace your backend' },
    { id: 'GW2b2g2O_sE', title: 'React Server Components - a 100-second explainer' },
    { id: 'zR3i_b4h2iA', title: 'React in 100 Seconds' },
  ],
  'UClb90NQQcskPUGDIXsQEz5Q': [
    { id: 'rfscVS0vtbw', title: 'Learn Python - Full Course for Beginners' },
    { id: 'zOjov-2OZ0E', title: 'Learn JavaScript - Full Course for Beginners' },
  ],
  'UC-8QAzbLcRglXeN_MY9blyw': [
      { id: 'k2KEp0tqY_g', title: 'I Made a Book About Making Books' },
      { id: 'xCM4A-P2h5s', title: 'Making a Book With a ReMarkable' },
  ]
};

export type Video = { id: string; title: string };
export type Channel = { id: string; name: string };
type MockVideos = { [key: string]: Video[] };

export function DashboardClient() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [shuffleResults, setShuffleResults] = useState<ShuffleCommentsOutput['results'] | null>(null);

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
            channels={mockChannels}
            onChannelSelect={handleChannelSelect}
            selectedChannel={selectedChannel}
        />
        {selectedChannel && (
          <VideoSelection
            key={selectedChannel.id}
            videos={(mockVideos as MockVideos)[selectedChannel.id] || []}
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
