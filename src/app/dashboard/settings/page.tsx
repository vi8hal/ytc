
import { getApiKeyAction } from "@/lib/actions";
import { SettingsForm } from "./_components/settings-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function SettingsPage() {
    const apiKeyData = await getApiKeyAction();

    return (
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
                    <p className="mt-1 text-lg text-muted-foreground">
                        Manage your application settings and API credentials.
                    </p>
                </div>
                
                <Alert className="mb-8">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Where to find your API Key</AlertTitle>
                    <AlertDescription>
                        You can obtain a YouTube Data API key from the{' '}
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline underline-offset-4">
                            Google Cloud Console
                        </a>
                        . Make sure the API is enabled for your project.
                    </AlertDescription>
                </Alert>

                <SettingsForm currentApiKey={apiKeyData.apiKey} />
            </div>
        </main>
    );
}
