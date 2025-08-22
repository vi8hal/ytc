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
          animation: tail-wag 1.5s ease-in-out infinite;
          transform-origin: 48px 80px; 
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(8deg); }
          50% { transform: rotate(-8deg); }
        }
      `}
    </style>
    <g transform="translate(-5, 0) scale(1.1)">
        {/* Taller Tail */}
        <path className="xerus-tail" fill="#C67A48" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M48.2,80.5 C38,95,20,100,25,60 C30,25,45,35,48.2,25.5 C55,45,55,65,48.2,80.5 Z" />

        {/* Back Leg */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M60,94 C55,98,45,98,42,92 C40,85,45,80,55,80 C65,80,68,88,60,94 Z" />
        <path fill="#F0D7C4" d="M60,94 C55,98,45,98,42,92" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Taller Body */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M85,54 C93,45,92,28,82,22 C70,16,60,28,58,45 C56,62,60,78,55,85 C50,85,50,70,70,55 C75,50,82,50,85,54 Z"/>
        {/* Underbelly */}
        <path fill="#F0D7C4" d="M72,48 C70,63,66,78,57,80 C62,73,65,55,72,48 Z" />
        {/* White Stripe */}
        <path fill="white" stroke="white" strokeWidth="1" d="M61,45 C65,55,75,60,82,55" strokeLinecap="round"/>
        
        {/* Presenting Arm/Hand */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M70,60 C75,58,85,62,88,68"/>

        {/* Head */}
        <path fill="#D9A37E" stroke="#8C542E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M82,22 C88,19,95,22,97,29 C99,35,95,42,88,45 C82,47,75,42,80,32 C82,27,82,22,82,22 Z"/>
        <circle cx="90" cy="32" r="4" fill="#5C2D0C" />
        <circle cx="91" cy="31" r="1.5" fill="white" />
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
