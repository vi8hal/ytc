import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logOutAction } from "@/lib/actions/auth";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-md p-2 transition-colors">
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="profile avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden text-right">
                {/* Note: In a real app, you would fetch user data and display it here */}
                <p className="truncate text-sm font-semibold">User</p>
                <p className="truncate text-xs text-muted-foreground">
                user@example.com
                </p>
            </div>
            <form action={logOutAction}>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" type="submit" title="Log Out">
                    <LogOut className="h-4 w-4" />
                </Button>
            </form>
            </div>
        </div>
      </header>
      <main className="flex-1">
        <Suspense>
            {children}
        </Suspense>
      </main>
    </div>
  )
}
