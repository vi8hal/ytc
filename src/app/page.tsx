import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { ArrowRight, BotMessageSquare, Search, ShieldCheck, Shuffle } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container relative pt-16 pb-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            Revolutionize Your YouTube Engagement
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
            ChronoComment uses AI to strategically shuffle and post your comments on multiple YouTube videos, boosting your visibility like never before.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        <section id="features" className="container py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why ChronoComment?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Unlock powerful features to automate and optimize your comment strategy.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center font-headline">Channel & Video Search</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Easily find and select target YouTube channels and videos right within the app.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BotMessageSquare className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center font-headline">AI Comment Shuffling</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Our GenAI randomly sends one of your four prepared comments to multiple videos.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shuffle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center font-headline">Smart Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Comments are posted randomly within a 10-minute window to appear more natural.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center font-headline">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Your data is safe with our secure authentication and privacy-focused design.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built to revolutionize YouTube engagement.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} ChronoComment. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
