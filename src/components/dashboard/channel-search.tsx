'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Channel } from './dashboard-client';

interface ChannelSearchProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel | null) => void;
}

export function ChannelSearch({ channels, selectedChannel, onChannelSelect }: ChannelSearchProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Step 1: Select a Channel</CardTitle>
        <CardDescription>Choose the YouTube channel you want to target.</CardDescription>
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
                ? channels.find((channel) => channel.name === selectedChannel.name)?.name
                : 'Select channel...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search channel..." />
              <CommandEmpty>No channel found.</CommandEmpty>
              <CommandList>
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
                          selectedChannel?.name === channel.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {channel.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
