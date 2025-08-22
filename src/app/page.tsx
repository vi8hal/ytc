
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
    const mouseRef = useRef<{ x: number; y: number; isReturning?: boolean; returnStartTime?: number }>({ x: 0, y: 0 });
    const animationFrameId = useRef<number>();
    const wavesRef = useRef<{x: number, y: number, radius: number, speed: number, maxRadius: number}[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let center = { x: 0, y: 0 };

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            center.x = canvas.width / 2;
            center.y = canvas.height / 2;
            if (!mouseRef.current.isReturning) {
                mouseRef.current.x = center.x;
                mouseRef.current.y = center.y;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const hexSize = 30;
        const hexWidth = Math.sqrt(3) * hexSize;
        const hexHeight = 2 * hexSize;
        const returnDuration = 4 * 60 * 1000; 

        canvas.addEventListener('mousemove', (e) => {
            mouseRef.current.isReturning = false;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mouseleave', () => {
            mouseRef.current.isReturning = true;
            mouseRef.current.returnStartTime = performance.now();
        });

        const createWave = () => {
            if (wavesRef.current.length > 5) return; // Limit number of active waves
            const side = Math.floor(Math.random() * 4);
            let x, y;
            switch(side) {
                case 0: // top
                    x = Math.random() * canvas.width;
                    y = 0;
                    break;
                case 1: // right
                    x = canvas.width;
                    y = Math.random() * canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * canvas.width;
                    y = canvas.height;
                    break;
                default: // left
                    x = 0;
                    y = Math.random() * canvas.height;
                    break;
            }
            wavesRef.current.push({
                x,
                y,
                radius: 0,
                speed: Math.random() * 0.4 + 0.2, // Randomized speed for more organic feel
                maxRadius: Math.max(canvas.width, canvas.height)
            });
        };

        const waveInterval = setInterval(createWave, 2500); // Slightly longer interval


        const drawHex = (x: number, y: number, mouseDistance: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const pointX = x + hexSize * Math.cos(angle);
                const pointY = y + hexSize * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(pointX, pointY);
                } else {
                    ctx.lineTo(pointX, pointY);
                }
            }
            ctx.closePath();

            let totalWaveInfluence = 0;
            wavesRef.current.forEach(wave => {
                const dx = x - wave.x;
                const dy = y - wave.y;
                const waveDistance = Math.sqrt(dx * dx + dy * dy);
                const waveWidth = 60; // The width of the ripple
                if (waveDistance < wave.radius && waveDistance > wave.radius - waveWidth) {
                    totalWaveInfluence += (1 - (wave.radius - waveDistance) / waveWidth) * 0.25;
                }
            });


            const maxDist = Math.min(canvas.width, canvas.height) / 2;
            const opacity = Math.max(0.1, 1 - mouseDistance / maxDist) + totalWaveInfluence;
            
            ctx.strokeStyle = `rgba(255, 223, 0, ${opacity * 0.6})`; // Slightly more subtle stroke
            ctx.lineWidth = 1;
            ctx.stroke();

            const fillRadius = 150;
            if (mouseDistance < fillRadius) {
                 const fillOpacity = 1 - (mouseDistance / fillRadius);
                 const gradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize * 0.8);
                 gradient.addColorStop(0, `rgba(255, 223, 0, ${fillOpacity * 0.6})`);
                 gradient.addColorStop(1, `rgba(255, 223, 0, 0)`);
                 ctx.fillStyle = gradient;
                 ctx.fill();
            }
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (mouseRef.current.isReturning) {
                const now = performance.now();
                const elapsed = now - (mouseRef.current.returnStartTime || now);
                const progress = Math.min(elapsed / returnDuration, 1);
                
                const startX = mouseRef.current.x;
                const startY = mouseRef.current.y;

                // Ease-out interpolation
                const easeOutProgress = 1 - Math.pow(1 - progress, 3);

                const newX = startX + (center.x - startX) * easeOutProgress;
                const newY = startY + (center.y - startY) * easeOutProgress;

                mouseRef.current.x = newX;
                mouseRef.current.y = newY;

                if (progress >= 1) {
                    mouseRef.current.isReturning = false;
                }
            }

            // Update and draw waves
            wavesRef.current = wavesRef.current.filter(wave => wave.radius < wave.maxRadius);
            wavesRef.current.forEach(wave => {
                wave.radius += wave.speed;
            });


            const cols = Math.ceil(canvas.width / hexWidth);
            const rows = Math.ceil(canvas.height / (hexHeight * 0.75));

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const xOffset = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
                    const yOffset = row * hexHeight * 0.75;
                    
                    const dx = xOffset - mouseRef.current.x;
                    const dy = yOffset - mouseRef.current.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    drawHex(xOffset, yOffset, distance);
                }
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            clearInterval(waveInterval);
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />;
}


export default function LandingPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [headlineText, setHeadlineText] = useState('');
    const fullHeadline = "Revolutionize Your YouTube Engagement";

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            let i = 0;
            setHeadlineText(''); // Reset on mount/remount
            const typingInterval = setInterval(() => {
                if (i < fullHeadline.length) {
                    setHeadlineText(prev => prev + fullHeadline.charAt(i));
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 75); // Typing speed in milliseconds

            return () => clearInterval(typingInterval);
        }
    }, [isMounted]);

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

      <main className="flex-1">
        <section className="container relative pt-20 pb-24 text-center md:pt-32 md:pb-32 overflow-hidden">
             {isMounted && <HexAnimation />}
            <div className="relative z-10">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline min-h-[1em]">
                    {headlineText}
                    <span className="animate-ping">|</span>
                </h1>
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

        <section id="features" className="bg-muted/50 py-16 lg:py-20">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why DCX1?</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                    Unlock powerful features to automate and optimize your comment strategy.
                    </p>
                </div>
                <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
                    <Card className="shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
                    <Card className="shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
                    <Card className="shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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

      <footer className="border-t bg-background">
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
