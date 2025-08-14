
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default function DashboardPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
            <p className="mt-1 text-lg text-muted-foreground">
                Configure and launch your comment shuffling campaign.
            </p>
        </div>
        <DashboardClient />
      </div>
    </main>
  );
}
