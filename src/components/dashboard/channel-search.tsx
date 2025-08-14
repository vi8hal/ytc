
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Search, AlertCircle, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchChannels } from '@/lib/actions';
import type { Channel } from './dashboard-client';
import { Alert, AlertDescription } from '../ui/alert';

interface ChannelSearchProps {
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel | null) => void;
  disabled?: boolean;
}

export function ChannelSearch({ selectedChannel, onChannelSelect, disabled = false }: ChannelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setChannels([]);
        setIsLoading(false);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchChannels(query);
        setChannels(results);
      } catch (error: any) {
        console.error('Failed to search channels:', error);
        setError(error.message || 'An unknown error occurred.');
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  const handleSelectChannel = (channel: Channel) => {
      onChannelSelect(channel);
      setSearchQuery(channel.name);
      setChannels([]);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 2: Select a Channel</CardTitle>
        <CardDescription>Search for the YouTube channel you want to target.</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please provide a valid YouTube API key in Step 1 to enable channel search.</AlertDescription>
            </Alert>
        ) : (
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search for a channel (min. 3 chars)..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            if (selectedChannel) {
                                onChannelSelect(null);
                            }
                        }}
                        className="pl-10"
                    />
                    {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>

                {(channels.length > 0 || error) && (
                    <div className="absolute top-full z-10 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
                        <ul className="max-h-60 overflow-y-auto p-1">
                            {error && <li className="p-2 text-sm text-destructive">{error}</li>}
                            {!isLoading && !error && channels.length === 0 && searchQuery.length >=3 && <li className="p-2 text-sm text-muted-foreground">No channels found.</li>}
                            {channels.map((channel) => (
                                <li 
                                    key={channel.id}
                                    className="flex cursor-pointer items-center justify-between rounded-sm p-2 text-sm hover:bg-accent"
                                    onClick={() => handleSelectChannel(channel)}
                                >
                                    <span>{channel.name}</span>
                                    {selectedChannel?.id === channel.id && <Check className="h-4 w-4" />}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
