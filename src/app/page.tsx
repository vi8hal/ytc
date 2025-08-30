
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { ArrowRight, BotMessageSquare, Search, ShieldCheck, Shuffle, Phone, Power, UserPlus } from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HexAnimation } from '@/components/landing/hex-animation'

const TypewriterHeadline = () => {
    const [headlineText, setHeadlineText] = useState('');
    const fullHeadline = "Revolutionize Engagement";

    useEffect(() => {
        let i = 0;
        setHeadlineText(''); // Reset on mount
        const typingInterval = setInterval(() => {
            if (i < fullHeadline.length) {
                setHeadlineText(prev => prev + fullHeadline.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 75); // Typing speed in milliseconds

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-headline min-h-[1em]">
            {headlineText}
            <span className="animate-ping">|</span>
        </h1>
    );
};


export default function LandingPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <HexAnimation />
      <header className="sticky top-0 z-50 w-auto mx-4 mt-2 border rounded-full border-white/10 bg-background/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <a href="tel:+918789217534" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">+91 87892 17534</span>
            </a>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/signin">
                                <Power className="h-4 w-4" />
                                <span className="sr-only">Sign In</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Sign In</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild size="icon">
                            <Link href="/signup">
                                <UserPlus className="h-4 w-4" />
                                <span className="sr-only">Sign Up</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Sign Up</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
       
        <section className="container relative z-40 pt-20 pb-20 text-center md:pt-32 md:pb-32">
            <div className="relative z-10">
                <TypewriterHeadline />
                <motion.p 
                    className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.8 }}
                >
                    Digital Campaign Xerus 1 uses AI agent to strategically shuffle and post your comments on multiple videos, boosting your visibility.
                </motion.p>
                <motion.div 
                    className="mt-10 flex justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.2 }}
                >
                    <Button size="lg" variant="outline" asChild>
                    <Link href="#features">Learn More</Link>
                    </Button>
                </motion.div>
            </div>
        </section>

        <section id="features" className="relative z-40 mx-4 rounded-lg border border-white/10 bg-background/50 py-12 backdrop-blur-md lg:py-16 mt-16">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why DCX1?</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                    Unlock powerful features to automate and optimize your comment strategy.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-white/10 bg-card/50 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-primary/10">
                        <CardHeader>
                            <div className="mb-4 flex justify-center">
                                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Search className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center font-headline text-xl">Channel & Video Search</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Easily find and select target channels and videos right within the app.
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card/50 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-primary/10">
                        <CardHeader>
                            <div className="mb-4 flex justify-center">
                                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BotMessageSquare className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center font-headline text-xl">AI Agent Comment Shuffling</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Our GenAI randomly sends one of your four prepared comments to multiple videos.
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card/50 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-primary/10">
                        <CardHeader>
                            <div className="mb-4 flex justify-center">
                                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Shuffle className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center font-headline text-xl">Smart Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Comments are posted randomly within a 10-minute window to appear more natural.
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card/50 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-primary/10">
                        <CardHeader>
                            <div className="mb-4 flex justify-center">
                                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center font-headline text-xl">Secure & Private</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Your data is safe with our secure authentication and privacy-focused design.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10 mt-16">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Vishal Singh
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} DCX1. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
   );
}
