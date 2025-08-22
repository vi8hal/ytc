import { cn } from '@/lib/utils';

const XerusLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={cn("h-8 w-8", className)}
    aria-hidden="true"
  >
    <style>
      {`
        .xerus-tail {
          animation: tail-wag 2.5s ease-in-out infinite;
          transform-origin: 25px 80px;
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }
      `}
    </style>
    <g className="fill-current text-primary">
      {/* Tail */}
      <path
        className="xerus-tail"
        d="M25.5,80.5 C15,70,10,50,22,32 C28,22,40,25,40,25 C40,25,35,40,45,55 C55,70,65,75,78,70 C90,65,95,50,90,38 C85,26,70,20,55,28 C55,28,60,45,50,60 C40,75,25.5,80.5,25.5,80.5Z"
      />
      {/* Body */}
      <path d="M45,75 C35,85,30,95,40,98 C50,101,65,95,75,85 C85,75,88,60,80,50 C72,40,60,42,50,55 C40,68,45,75,45,75Z" />
      {/* Head */}
      <circle cx="78" cy="48" r="10" />
      {/* Eye */}
      <circle cx="81" cy="46" r="1.5" fill="hsl(var(--primary-foreground))" />
      {/* Ear */}
      <path d="M72,39 A 5 5 0 0 1 78 37" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
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
