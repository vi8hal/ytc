
'use client';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { ArrowRight, BotMessageSquare, Search, ShieldCheck, Shuffle, Phone } from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useEffect, useState } from 'react';

const AnimatedSupernova = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [primaryColor, setPrimaryColor] = useState('283 100% 60%'); // Default HSL value
    const mouse = useRef({ x: 9999, y: 9999 });

    useEffect(() => {
        // This code now runs only on the client, after the component has mounted.
        // This prevents hydration errors by ensuring server and client render match initially.
        if (typeof window !== 'undefined') {
            const computedStyle = getComputedStyle(document.documentElement);
            const primaryValue = computedStyle.getPropertyValue('--primary').trim();
            setPrimaryColor(primaryValue);
        }
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = []; // Reset particles on resize
            initParticles();
        };

        const handleMouseMove = (event: MouseEvent) => {
            mouse.current.x = event.clientX;
            mouse.current.y = event.clientY;
        };
        const handleMouseLeave = () => {
            mouse.current.x = 9999;
            mouse.current.y = 9999;
        }

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            
            constructor(x: number, y: number, size: number, speedX: number, speedY: number, color: string) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speedX = speedX;
                this.speedY = speedY;
                this.color = color;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.size > 0.2) this.size -= 0.01;

                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }

            draw() {
                ctx!.fillStyle = this.color;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        const initParticles = () => {
            const numberOfParticles = Math.floor(canvas.width / 5);
            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 1.5 + 0.5;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const speedX = (Math.random() - 0.5) * 0.5;
                const speedY = (Math.random() - 0.5) * 0.5;
                const color = `hsl(${primaryColor}, ${Math.random() * 30 + 70}%)`;
                particles.push(new Particle(x, y, size, speedX, speedY, color));
            }
        };

        const animate = () => {
            ctx!.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Supernova
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const sunRadius = Math.min(canvas.width, canvas.height) / 10;
            const gradient = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
            gradient.addColorStop(0, `hsla(${primaryColor}, 0.5)`);
            gradient.addColorStop(0.5, `hsla(${primaryColor}, 0.2)`);
            gradient.addColorStop(1, `hsla(${primaryColor}, 0)`);
            ctx!.fillStyle = gradient;
            ctx!.beginPath();
            ctx!.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            ctx!.fill();


            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            // Draw connections to mouse
            const connectRadius = 200;
            ctx!.strokeStyle = `hsla(${primaryColor}, 0.5)`;
            ctx!.lineWidth = 0.3;
            for (let i = 0; i < particles.length; i++) {
                const dx = mouse.current.x - particles[i].x;
                const dy = mouse.current.y - particles[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < connectRadius) {
                    ctx!.beginPath();
                    ctx!.moveTo(particles[i].x, particles[i].y);
                    ctx!.lineTo(mouse.current.x, mouse.current.y);
                    ctx!.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        
        resizeCanvas();
        animate();

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [primaryColor]);

    return <canvas ref={canvasRef} className="absolute inset-0 -z-10 w-full h-full" />;
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
        <section className="container relative pt-20 pb-24 text-center md:pt-32 md:pb-32 overflow-hidden">
          <AnimatedSupernova />
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
