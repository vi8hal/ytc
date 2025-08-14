import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default function DashboardPage() {
  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
                Configure and launch your comment shuffling campaign.
            </p>
        </div>
        <DashboardClient />
      </div>
    </main>
  );
}
