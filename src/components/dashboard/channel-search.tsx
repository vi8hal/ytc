
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import debounce from 'lodash.debounce';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchChannels } from '@/lib/actions';
import type { Channel } from './dashboard-client';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

interface ChannelSearchProps {
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel | null) => void;
  disabled?: boolean;
}

export function ChannelSearch({ selectedChannel, onChannelSelect, disabled = false }: ChannelSearchProps) {
  const [open, setOpen] = useState(false);
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
      } catch (error) {
        console.error('Failed to search channels:', error);
        setError('Failed to search for channels. Check your API key and permissions.');
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Step 2: Select a Channel</CardTitle>
        <CardDescription>Search for the YouTube channel you want to target.</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
            <Alert variant="destructive">
                <AlertDescription>Please set your YouTube API key in Step 1 before searching for channels.</AlertDescription>
            </Alert>
        ) : (
            <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                >
                {selectedChannel
                    ? channels.find((channel) => channel.id === selectedChannel.id)?.name || selectedChannel.name
                    : 'Select channel...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                <CommandInput 
                    placeholder="Search for a channel (min. 3 chars)..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                />
                <CommandList>
                    {isLoading && (
                        <div className='p-2 space-y-2'>
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    )}
                    {error && <CommandEmpty>{error}</CommandEmpty>}
                    {!isLoading && !error && !channels.length && searchQuery.length >= 3 && <CommandEmpty>No channel found.</CommandEmpty>}
                    {!isLoading && !error && (
                    <CommandGroup>
                        {channels.map((channel) => (
                        <CommandItem
                            key={channel.id}
                            value={channel.name}
                            onSelect={(currentValue) => {
                            const selected = channels.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                            onChannelSelect(selected || null);
                            setOpen(false);
                            }}
                        >
                            <Check
                            className={cn(
                                'mr-2 h-4 w-4',
                                selectedChannel?.id === channel.id ? 'opacity-100' : 'opacity-0'
                            )}
                            />
                            {channel.name}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                    )}
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        )}
      </CardContent>
    </Card>
  );
}
