import { cn } from '@/lib/utils';

const XerusLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={cn("h-8 w-8", className)}
    aria-hidden="true"
    // Set a base color for the logo, which can be overridden by className
    style={{ color: '#A16E2E' }} 
  >
    <style>
      {`
        .xerus-tail {
          animation: tail-wag 2.5s ease-in-out infinite;
          /* Adjusted for the new standing position */
          transform-origin: 50px 85px; 
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
      `}
    </style>
    {/* The fill is set to 'currentColor' so it can be controlled via parent's text color or inline style */}
    <g className="fill-current">
        {/* Body */}
        <path d="M50,45 C45,60 40,75 42,88 C44,101 56,101 58,88 C60,75 55,60 50,45Z" />
        {/* Head */}
        <path d="M47,25 C45,30 45,45 50,45 C55,45 55,30 53,25 C51,20 49,20 47,25Z" />
        {/* Ear Left */}
        <path d="M47,25 C46,22 47,20 48,20 C49,20 48,23 47,25Z" />
        {/* Ear Right */}
        <path d="M53,25 C54,22 53,20 52,20 C51,20 52,23 53,25Z" />
        {/* Eye Left */}
        <circle cx="48.5" cy="33" r="1.2" fill="white" />
        {/* Eye Right */}
        <circle cx="51.5" cy="33" r="1.2" fill="white" />
        {/* Tail */}
        <path className="xerus-tail" d="M50,85 C40,75 35,60 40,45 C45,30 55,25 65,30 C75,35 80,50 75,65 C70,80 60,90 50,85Z" />
    </g>
  </svg>
);


export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <XerusLogo />
      <span className="text-xl font-bold font-headline">DCX1</span>
    </div>
  );
}
