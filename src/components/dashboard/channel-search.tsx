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

interface ChannelSearchProps {
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel | null) => void;
}

export function ChannelSearch({ selectedChannel, onChannelSelect }: ChannelSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setChannels([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await searchChannels(query);
        setChannels(results);
      } catch (error) {
        console.error('Failed to search channels:', error);
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 1: Select a Channel</CardTitle>
        <CardDescription>Search for and choose the YouTube channel you want to target.</CardDescription>
      </CardHeader>
      <CardContent>
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
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search for a channel..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                isLoading={isLoading}
              />
              <CommandList>
                {isLoading && <CommandEmpty>Loading...</CommandEmpty>}
                {!isLoading && !channels.length && <CommandEmpty>No channel found.</CommandEmpty>}
                {!isLoading && (
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
      </CardContent>
    </Card>
  );
}
