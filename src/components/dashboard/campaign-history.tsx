
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Calendar, Hash, Youtube } from 'lucide-react';
import type { Campaign } from './dashboard-client';

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} days ago`;
}

export function CampaignHistory({ campaigns }: { campaigns: Campaign[] }) {

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
            <History className="text-primary" />
            Recent Campaigns
        </CardTitle>
        <CardDescription>
            A list of your 5 most recently executed campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date</div></TableHead>
                    <TableHead><div className="flex items-center gap-2"><Youtube className="h-4 w-4" /> Credential Set</div></TableHead>
                    <TableHead className="text-right"><div className="flex items-center gap-2 justify-end"><Hash className="h-4 w-4" /> Comments Sent</div></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {campaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                        <TableCell>
                            <div className="font-medium">{formatRelativeTime(campaign.createdAt)}</div>
                            <div className="text-xs text-muted-foreground">{new Date(campaign.createdAt).toLocaleString()}</div>
                        </TableCell>
                        <TableCell>{campaign.credentialName}</TableCell>
                        <TableCell className="text-right">{campaign.eventCount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
