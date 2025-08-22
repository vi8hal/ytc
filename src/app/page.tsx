
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
    const mousePos = useRef({ x: -1000, y: -1000 });
    
    // State for the glowing hexagons
    const glowingHexes = useRef<Set<string>>(new Set());
    const hexGlowData = useRef<Map<string, { startTime: number, duration: number }>>(new Map());

    // State for shrinking hexagons
    const shrinkingHexes = useRef<Set<string>>(new Set());
    const hexShrinkData = useRef<Map<string, { startTime: number, duration: number }>>(new Map());


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
        
        const handleMouseMove = (event: MouseEvent) => {
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                mousePos.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            }
        };

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        resizeCanvas();
        
        const hexSize = 20;
        const gap = 5;
        const hexWidth = Math.sqrt(3) * hexSize;
        const hexHeight = 2 * hexSize;

        const pickNewEffectHex = () => {
            const cols = Math.ceil(canvas.width / (hexWidth + gap));
            const rows = Math.ceil(canvas.height / ((hexHeight * 0.75) + gap));
            const randomRow = Math.floor(Math.random() * rows);
            const randomCol = Math.floor(Math.random() * cols);
            const key = `${randomCol}-${randomRow}`;

            // Decide which effect to apply
            if (Math.random() > 0.4) { // More likely to be a glow
                if (glowingHexes.current.size < 15 && !glowingHexes.current.has(key) && !shrinkingHexes.current.has(key)) {
                    glowingHexes.current.add(key);
                    hexGlowData.current.set(key, {
                        startTime: performance.now(),
                        duration: 2000 + Math.random() * 3000 // Glow for 2-5 seconds
                    });
                }
            } else {
                 if (shrinkingHexes.current.size < 8 && !shrinkingHexes.current.has(key) && !glowingHexes.current.has(key)) {
                    shrinkingHexes.current.add(key);
                    hexShrinkData.current.set(key, {
                        startTime: performance.now(),
                        duration: 1500 + Math.random() * 1500 // Shrink for 1.5-3 seconds
                    });
                }
            }
        };

        const effectInterval = setInterval(pickNewEffectHex, 200);

        const drawHex = (x: number, y: number, isGlowing: boolean, glowProgress: number, isShrinking: boolean, shrinkProgress: number) => {
            ctx.save();
            
            let currentSize = hexSize;
            if (isShrinking) {
                // Animate size reduction: starts at full size, shrinks to half, then grows back
                const shrinkFactor = Math.sin(shrinkProgress * Math.PI);
                currentSize = hexSize - (hexSize / 2) * shrinkFactor;
            }

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const pointX = x + currentSize * Math.cos(angle);
                const pointY = y + currentSize * Math.sin(angle);
                ctx.lineTo(pointX, pointY);
            }
            ctx.closePath();

            if (isShrinking || shrinkingHexes.current.has(`${Math.round(x / ((Math.sqrt(3) * hexSize) + gap))}-${Math.round(y / ((2*hexSize*0.75)+gap))}`)) {
                // Metallic golden brown fill
                const metalGradient = ctx.createLinearGradient(x - currentSize, y - currentSize, x + currentSize, y + currentSize);
                metalGradient.addColorStop(0, '#B8860B'); // DarkGoldenrod
                metalGradient.addColorStop(0.5, '#8B4513'); // SaddleBrown
                metalGradient.addColorStop(1, '#98693E'); // Light Brown/Bronze
                ctx.fillStyle = metalGradient;
                ctx.fill();
                
                ctx.strokeStyle = '#5C4033'; // Darker brown border
                ctx.lineWidth = 1;

            } else {
                 // Default dark 3D effect
                const gradient = ctx.createLinearGradient(x - currentSize, y - currentSize, x + currentSize, y + currentSize);
                gradient.addColorStop(0, '#1C1C1C'); // Slightly lighter top-left
                gradient.addColorStop(1, '#121212'); // Slightly darker bottom-right
                ctx.fillStyle = gradient;
                ctx.fill();
                 ctx.strokeStyle = "rgba(0,0,0,0.3)";
                 ctx.lineWidth = 1;
            }
            
            ctx.stroke();

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
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
                ctx.stroke();
            }
            ctx.restore();
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const now = performance.now();

            // Update effects - only remove expired glows, not shrinks
            const expiredGlows: string[] = [];
            hexGlowData.current.forEach((data, key) => {
                if (now > data.startTime + data.duration) {
                    expiredGlows.push(key);
                }
            });

            expiredGlows.forEach(key => {
                glowingHexes.current.delete(key);
                hexGlowData.current.delete(key);
            });

            const effectiveHexWidth = hexWidth + gap;
            const effectiveHexHeight = hexHeight * 0.75 + gap;
            const hoverRadius = 50;

            const cols = Math.ceil(canvas.width / effectiveHexWidth) + 1;
            const rows = Math.ceil(canvas.height / effectiveHexHeight) + 1;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const xOffset = col * effectiveHexWidth + (row % 2 === 1 ? effectiveHexWidth / 2 : 0);
                    const yOffset = row * effectiveHexHeight;
                    const key = `${col}-${row}`;
                    
                    // Check for mouse hover
                    const dx = mousePos.current.x - xOffset;
                    const dy = mousePos.current.y - yOffset;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < hoverRadius && !glowingHexes.current.has(key) && !shrinkingHexes.current.has(key)) {
                        glowingHexes.current.add(key);
                        hexGlowData.current.set(key, {
                           startTime: now,
                           duration: 3000 // glow for 3 seconds
                        });
                    }

                    const isGlowing = glowingHexes.current.has(key);
                    const isShrinking = shrinkingHexes.current.has(key);
                    
                    let glowProgress = 0;
                    if(isGlowing) {
                        const data = hexGlowData.current.get(key)!;
                        glowProgress = (now - data.startTime) / data.duration;
                    }
                    
                    let shrinkProgress = 0;
                    if(isShrinking) {
                        const data = hexShrinkData.current.get(key);
                        if (data) {
                           shrinkProgress = (now - data.startTime) / data.duration;
                           if (shrinkProgress >= 1) {
                               // Animation finished, but we keep it in the shrinkingHexes set.
                               // We just stop calculating progress.
                               shrinkProgress = 1;
                               hexShrinkData.current.delete(key); // Remove data to stop re-calculating
                           }
                        } else {
                           // Hexagon is in the set, but its animation data is gone, meaning it's finished.
                           shrinkProgress = 1;
                        }
                    }

                    drawHex(xOffset, yOffset, isGlowing, glowProgress, isShrinking || shrinkingHexes.current.has(key), shrinkProgress);
                }
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (canvas) {
              canvas.removeEventListener('mousemove', handleMouseMove);
            }
            clearInterval(effectInterval);
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isMounted]);

    if (!isMounted) return null;

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full bg-[#0A0A0A]" />;
}

const TypewriterHeadline = () => {
    const [headlineText, setHeadlineText] = useState('');
    const fullHeadline = "Revolutionize Your Engagement";

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
       
        <section className="container relative pt-20 pb-20 text-center md:pt-28 md:pb-28">
            <div className="relative z-10">
                <TypewriterHeadline />
                <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
                    Digital Campaign Xerus 1 uses AI agent to strategically shuffle and post your comments on multiple videos, boosting your visibility like never before.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button size="lg" variant="outline" asChild>
                    <Link href="#features">Learn More</Link>
                    </Button>
                </div>
            </div>
        </section>

        <section id="features" className="relative z-10 mx-4 rounded-lg border border-white/10 bg-background/50 py-16 backdrop-blur-md lg:py-20">
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
              Built to revolutionize engagement.
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
