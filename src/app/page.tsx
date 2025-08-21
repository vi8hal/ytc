
'use client';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { ArrowRight, BotMessageSquare, Search, ShieldCheck, Shuffle, Phone } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';

// A client-side component to render the animated background
const AnimatedConstellation = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
        const particleCount = 80;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * 0.4 - 0.2, // Slow velocity
                vy: Math.random() * 0.4 - 0.2,
                radius: Math.random() * 1.5 + 0.5,
            });
        }

        const draw = () => {
            if(!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Get computed color values from CSS variables
            const computedStyle = getComputedStyle(canvas);
            const primaryColorValue = computedStyle.getPropertyValue('--primary').trim();
            const particleColor = `hsl(${primaryColorValue})`; 
            const lineColor = `hsla(${primaryColorValue}, 0.8)`;

            // Draw the Sun
            const sunRadius = 40;
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius * 2);
            gradient.addColorStop(0, `hsla(${primaryColorValue.replace(/\s/g, ', ')}, 0.8)`);
            gradient.addColorStop(0.4, `hsla(${primaryColorValue.replace(/\s/g, ', ')}, 0.4)`);
            gradient.addColorStop(1, `hsla(${primaryColorValue.replace(/\s/g, ', ')}, 0)`);

            ctx.beginPath();
            ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();


            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            });

            ctx.beginPath();
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < 120) {
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                    }
                }
            }
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 -z-10 h-full w-full opacity-100"
        />
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
          <div className="flex flex-1 items-center justify-end space-x-4">
            <a href="tel:+918789217534" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Phone className="h-4 w-4" />
                <span>+91 87892 17534</span>
            </a>
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
        <section className="container relative pt-20 pb-24 text-center md:pt-32 md:pb-32">
          <AnimatedConstellation />
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            Revolutionize Your YouTube Engagement
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
            DCX1 uses AI to strategically shuffle and post your comments on multiple YouTube videos, boosting your visibility like never before.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
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
                    <Card className="shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
                    <Card className="shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <CardHeader>
                            <div className="mb-4 flex justify-center">
                                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BotMessageSquare className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center font-headline text-xl">AI Comment Shuffling</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Our GenAI randomly sends one of your four prepared comments to multiple videos.
                        </CardContent>
                    </Card>
                    <Card className="shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
                    <Card className="shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
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
  )
}
