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
          transform-origin: 50px 85px; 
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(4deg); }
          50% { transform: rotate(-4deg); }
        }
      `}
    </style>
    <g>
      {/* Tail */}
      <path className="xerus-tail" fill="#A0522D" d="M52,100 C75,95 90,75 90,50 C90,25 75,5 52,0 C47,20 47,75 52,100 Z" />
      <path className="xerus-tail" fill="#CD853F" d="M54,95 C72,90 85,72 85,50 C85,28 72,10 54,5 C50,25 50,70 54,95 Z" />

      {/* Body */}
      <path fill="#D2B48C" d="M48,35 C38,40 32,55 34,75 C35,85 40,95 50,98 C52,85 54,50 48,35 Z" />
      <path fill="#DEB887" d="M49,38 C40,42 36,55 38,72 C39,82 43,92 50,95 C51,82 53,52 49,38 Z" />

      {/* Head */}
      <path fill="#D2B48C" d="M48,35 C58,25 68,28 73,35 C78,42 75,55 68,60 C60,65 52,60 48,50 C42,45 45,38 48,35 Z" />

      {/* Ear */}
      <path fill="#A0522D" d="M71,32 C75,30 78,32 78,36 C78,40 73,42 71,40 C69,38 69,34 71,32 Z" />

      {/* Eye */}
      <circle cx="66" cy="45" r="3.5" fill="#2F2F2F" />
      <circle cx="67" cy="44" r="1.2" fill="white" />

      {/* Feet */}
      <path fill="#A0522D" d="M50,98 C47,100 42,103 44,105 C47,107 52,105 52,102 C52,99 51,98 50,98 Z" />
      <path fill="#A0522D" d="M40,93 C37,95 35,99 37,101 C39,103 42,101 42,98 C42,95 41,94 40,93 Z" />
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
