
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { getCampaignHistory } from '@/lib/actions/campaign';
import { getCredentialSetsAction } from '@/lib/actions/credentials';

export default async function DashboardPage() {
  // Pre-fetch initial data on the server for a faster start
  const initialCampaigns = await getCampaignHistory();
  const initialCredentialSets = await getCredentialSetsAction();

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Comment DCX1</h1>
            <p className="mt-1 text-lg text-muted-foreground">
                Configure and launch your comment shuffling campaign in 5 easy steps.
            </p>
        </div>
        <DashboardClient 
          initialCampaigns={initialCampaigns} 
          initialCredentialSets={initialCredentialSets}
        />
      </div>
    </main>
  );
}
