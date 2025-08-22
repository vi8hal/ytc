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
          animation: tail-wag 3s ease-in-out infinite;
          transform-origin: 48px 75px; 
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(2deg); }
          50% { transform: rotate(-2deg); }
        }
      `}
    </style>
    <g transform="translate(-5, 5) scale(1.1)">
        {/* Tail */}
        <path className="xerus-tail" fill="#C67A48" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M48.2,75.5 C32,80,20,95,28,58 C35,25,40,25,48.2,27.5 C55,45,55,60,48.2,75.5 Z" />

        {/* Back Leg */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M60,94 C55,98,45,98,42,92 C40,85,45,80,55,80 C65,80,68,88,60,94 Z" />
        <path fill="#F0D7C4" d="M60,94 C55,98,45,98,42,92" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />


        {/* Body */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M85,54 C93,45,92,30,82,25 C70,20,60,30,58,45 C58,68,65,82,55,82 C50,82,50,70,70,55 C75,50,82,50,85,54 Z"/>
        {/* Underbelly */}
        <path fill="#F0D7C4" d="M72,48 C70,63,66,78,57,80 C62,73,65,55,72,48 Z" />
        {/* White Stripe */}
        <path fill="white" stroke="white" strokeWidth="1" d="M61,45 C65,55,75,60,82,55" strokeLinecap="round"/>

        {/* Head */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M82,25 C88,22,95,25,97,32 C99,38,95,45,88,48 C82,50,75,45,80,35 C82,30,82,25,82,25 Z"/>
        <circle cx="90" cy="35" r="4" fill="#5C2D0C" />
        <circle cx="91" cy="34" r="1.5" fill="white" />
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
