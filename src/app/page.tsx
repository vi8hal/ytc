
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { ArrowRight, BotMessageSquare, Search, ShieldCheck, Shuffle, Phone, Power, UserPlus } from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const HexAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();
    const [isMounted, setIsMounted] = useState(false);
    
    // State for the glowing hexagons
    const glowingHexes = useRef<Set<string>>(new Set());
    const hexGlowData = useRef<Map<string, { startTime: number, duration: number }>>(new Map());


    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        const hexSize = 50;
        const hexWidth = Math.sqrt(3) * hexSize;
        const hexHeight = 2 * hexSize;

        const pickNewGlowingHex = () => {
            const cols = Math.ceil(canvas.width / hexWidth);
            const rows = Math.ceil(canvas.height / (hexHeight * 0.75));
            const randomRow = Math.floor(Math.random() * rows);
            const randomCol = Math.floor(Math.random() * cols);
            const key = `${randomCol}-${randomRow}`;

            if (glowingHexes.current.size < 5 && !glowingHexes.current.has(key)) {
                glowingHexes.current.add(key);
                hexGlowData.current.set(key, {
                    startTime: performance.now(),
                    duration: 2000 + Math.random() * 3000 // Glow for 2-5 seconds
                });
            }
        };

        const glowInterval = setInterval(pickNewGlowingHex, 500);

        const drawHex = (x: number, y: number, isGlowing: boolean, glowProgress: number) => {
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const pointX = x + hexSize * Math.cos(angle);
                const pointY = y + hexSize * Math.sin(angle);
                ctx.lineTo(pointX, pointY);
            }
            ctx.closePath();

            // Create a subtle 3D effect with a gradient
            const gradient = ctx.createLinearGradient(x - hexSize, y - hexSize, x + hexSize, y + hexSize);
            gradient.addColorStop(0, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');

            ctx.fillStyle = gradient;
            ctx.fill();

            if (isGlowing) {
                const opacity = Math.sin(glowProgress * Math.PI); // Pulse effect
                const colorStops = [
                    { offset: 0, color: `rgba(0, 255, 255, ${opacity * 0.8})` }, // Cyan
                    { offset: 0.5, color: `rgba(138, 43, 226, ${opacity * 0.8})` }, // BlueViolet
                    { offset: 1, color: `rgba(0, 255, 255, ${opacity * 0.8})` }, // Cyan
                ];

                const glowGradient = ctx.createLinearGradient(x - hexSize, y, x + hexSize, y);
                colorStops.forEach(stop => glowGradient.addColorStop(stop.offset, stop.color));

                ctx.strokeStyle = glowGradient;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(138, 43, 226, 0.7)';
                ctx.stroke();
            }
            ctx.restore();
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const now = performance.now();

            // Update glowing hexes
            const expiredHexes: string[] = [];
            hexGlowData.current.forEach((data, key) => {
                if (now > data.startTime + data.duration) {
                    expiredHexes.push(key);
                }
            });
            expiredHexes.forEach(key => {
                glowingHexes.current.delete(key);
                hexGlowData.current.delete(key);
            });


            const cols = Math.ceil(canvas.width / hexWidth) + 1;
            const rows = Math.ceil(canvas.height / (hexHeight * 0.75)) + 1;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const xOffset = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
                    const yOffset = row * hexHeight * 0.75;
                    const key = `${col}-${row}`;
                    const isGlowing = glowingHexes.current.has(key);
                    
                    let glowProgress = 0;
                    if(isGlowing) {
                        const data = hexGlowData.current.get(key)!;
                        glowProgress = (now - data.startTime) / data.duration;
                    }

                    drawHex(xOffset, yOffset, isGlowing, glowProgress);
                }
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            clearInterval(glowInterval);
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isMounted]);

    if (!isMounted) return null;

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full bg-[#111]" />;
}

const TypewriterHeadline = () => {
    const [headlineText, setHeadlineText] = useState('');
    const fullHeadline = "Revolutionize Your YouTube Engagement";

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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <HexAnimation />
        <section className="container relative pt-20 pb-24 text-center md:pt-32 md:pb-32">
            <div className="relative z-10">
                <TypewriterHeadline />
                <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
                    Digital Campaign Xerus 1 uses AI agent to strategically shuffle and post your comments on multiple YouTube videos, boosting your visibility like never before.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button size="lg" variant="outline" asChild>
                    <Link href="#features">Learn More</Link>
                    </Button>
                </div>
            </div>
        </section>

        <section id="features" className="relative z-10 border-t border-b border-white/10 bg-background/50 py-16 backdrop-blur-md lg:py-20">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why DCX1?</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                    Unlock powerful features to automate and optimize your comment strategy.
                    </p>
                </div>
                <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                            Easily find and select target YouTube channels and videos right within the app.
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

      <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built to revolutionize YouTube engagement.
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
