
'use client';

import React, { useRef, useEffect, useState } from 'react';

export const HexAnimation: React.FC = () => {
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
            mousePos.current = { x: event.clientX, y: event.clientY };
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
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
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(effectInterval);
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isMounted]);

    if (!isMounted) return null;

    return <canvas ref={canvasRef} className="fixed inset-0 z-40 h-full w-full bg-[#0A0A0A] pointer-events-none" />;
}
