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
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-6deg); }
        }
      `}
    </style>
    <g transform="translate(5, 5)">
      {/* Tail */}
      <path className="xerus-tail" fill="#A0522D" d="M50,95 C70,90 85,70 85,50 C85,30 70,10 50,5 C45,20 45,70 50,95 Z" />
      <path className="xerus-tail" fill="#CD853F" d="M52,90 C68,85 80,68 80,50 C80,32 68,15 52,10 C48,25 48,65 52,90 Z" />

      {/* Body */}
      <path fill="#D2B48C" d="M45,35 C35,40 30,55 32,70 C33,80 38,90 48,93 C50,80 52,50 45,35 Z" />
      <path fill="#DEB887" d="M46,38 C38,42 34,55 36,68 C37,78 41,87 48,90 C49,78 51,52 46,38 Z" />

      {/* Head */}
      <path fill="#D2B48C" d="M45,35 C55,25 65,28 70,35 C75,42 72,55 65,60 C58,65 50,60 45,50 C40,45 42,38 45,35 Z" />

      {/* Ear */}
      <path fill="#A0522D" d="M68,32 C72,30 75,32 75,36 C75,40 70,42 68,40 C66,38 66,34 68,32 Z" />

      {/* Eye */}
      <circle cx="63" cy="45" r="3" fill="#2F2F2F" />
      <circle cx="64" cy="44" r="1" fill="white" />

      {/* Feet */}
      <path fill="#A0522D" d="M48,93 C45,95 40,98 42,100 C45,102 50,100 50,97 C50,94 49,93 48,93 Z" />
      <path fill="#A0522D" d="M38,88 C35,90 33,94 35,96 C37,98 40,96 40,93 C40,90 39,89 38,88 Z" />
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
