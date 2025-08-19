
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Search, AlertCircle, Loader2, X, PlusCircle } from 'lucide-react';
import debounce from 'lodash.debounce';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchChannels } from '@/lib/actions/youtube';
import type { Channel } from './dashboard-client';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import Image from 'next/image';

interface ChannelSearchProps {
  apiKey: string | null;
  selectedChannels: Channel[];
  onChannelsChange: (channels: Channel[]) => void;
  disabled?: boolean;
}

export function ChannelSearch({ apiKey, selectedChannels, onChannelsChange, disabled = false }: ChannelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (query: string, key: string | null) => {
      if (!key || query.length < 3) {
        setSearchResults([]);
        setIsLoading(false);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchChannels(key, query);
        setSearchResults(results.filter(
          result => !selectedChannels.some(selected => selected.id === result.id)
        ));
      } catch (error: any) {
        setError(error.message || 'An unknown error occurred.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [selectedChannels]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, apiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, apiKey]);
  
  const handleAddChannel = (channel: Channel) => {
      if (!selectedChannels.some(c => c.id === channel.id)) {
        onChannelsChange([...selectedChannels, channel]);
      }
      setSearchQuery('');
      setSearchResults([]);
  }

  const handleRemoveChannel = (channelId: string) => {
    onChannelsChange(selectedChannels.filter(c => c.id !== channelId));
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 2: Select Channels</CardTitle>
        <CardDescription>Search for and select the YouTube channels you want to target.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className='space-y-4'>
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search for channels to add (min. 3 chars)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={disabled}
                    />
                    {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>

                {searchQuery.length > 0 && (
                    <div className="absolute top-full z-10 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
                        <ul className="max-h-60 overflow-y-auto p-1">
                            {error && <li className="p-2 text-sm text-destructive">{error}</li>}
                            {!isLoading && !error && searchResults.length === 0 && searchQuery.length >=3 && <li className="p-2 text-sm text-muted-foreground">No new channels found.</li>}
                            {searchResults.map((channel) => (
                                <li 
                                    key={channel.id}
                                    className="flex cursor-pointer items-center justify-between rounded-sm p-2 text-sm hover:bg-accent"
                                    onClick={() => handleAddChannel(channel)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Image src={channel.thumbnail} alt={channel.name} width={28} height={28} className="rounded-full" />
                                        <span>{channel.name}</span>
                                    </div>
                                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {disabled && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Please provide a valid YouTube API key and connect your account in Step 1 to enable channel search.</AlertDescription>
                </Alert>
            )}
            
            {selectedChannels.length > 0 && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-muted-foreground'>Selected Channels:</h4>
                <div className='flex flex-wrap gap-2'>
                  {selectedChannels.map(channel => (
                    <Badge key={channel.id} variant="secondary" className="pl-2 pr-1 text-sm h-7">
                      <Image src={channel.thumbnail} alt={channel.name} width={20} height={20} className="rounded-full mr-2" />
                      {channel.name}
                      <Button variant="ghost" size="icon" className='h-5 w-5 ml-1' onClick={() => handleRemoveChannel(channel.id)}>
                         <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
      </CardContent>
    </Card>
  );
}
