import React from 'react';

export interface CrewmateColor {
  id: string;
  name: string;
  body: string;
  shadow: string;
}

export const CREWMATE_COLORS: CrewmateColor[] = [
  { id: 'red', name: 'Red', body: '#ef4444', shadow: '#991b1b' },
  { id: 'black', name: 'Black', body: '#334155', shadow: '#0f172a' },
  { id: 'cyan', name: 'Cyan', body: '#06b6d4', shadow: '#0e7490' },
  { id: 'purple', name: 'Purple', body: '#a855f7', shadow: '#6b21a8' },
  { id: 'orange', name: 'Orange', body: '#f97316', shadow: '#c2410c' },
  { id: 'lime', name: 'Lime', body: '#84cc16', shadow: '#4d7c0f' },
  { id: 'yellow', name: 'Yellow', body: '#eab308', shadow: '#a16207' },
  { id: 'pink', name: 'Pink', body: '#ec4899', shadow: '#9d174d' },
  { id: 'blue', name: 'Blue', body: '#3b82f6', shadow: '#1d4ed8' },
  { id: 'white', name: 'White', body: '#e2e8f0', shadow: '#64748b' },
  { id: 'maroon', name: 'Maroon', body: '#9f1239', shadow: '#4c0519' },
  { id: 'teal', name: 'Teal', body: '#14b8a6', shadow: '#0f766e' }
];

export function getColorById(colorId?: string): CrewmateColor {
  return CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[0];
}

interface Props {
  colorId?: string;
  size?: number;
  className?: string;
  isDead?: boolean;
}

export const CrewmateIcon: React.FC<Props> = ({
  colorId = 'red',
  size = 40,
  className = '',
  isDead = false
}) => {
  const color = getColorById(colorId);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Backpack */}
        <rect
          x="10"
          y="35"
          width="20"
          height="55"
          rx="10"
          fill={color.shadow}
          stroke="#000000"
          strokeWidth="6"
        />

        {/* Body Main */}
        <path
          d="M30 35 C30 12, 75 12, 75 35 L75 90 C75 98, 70 105, 62 105 L58 105 C50 105, 52 95, 52 90 L52 82 L46 82 L46 90 C46 95, 48 105, 40 105 L36 105 C28 105, 25 98, 25 90 Z"
          fill={color.body}
          stroke="#000000"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Body Shadow (bottom) */}
        <path
          d="M25 80 Q50 95 75 80 L75 90 C75 98, 70 105, 62 105 L58 105 C50 105, 52 95, 52 90 L52 82 L46 82 L46 90 C46 95, 48 105, 40 105 L36 105 C28 105, 25 98, 25 90 Z"
          fill={color.shadow}
        />

        {/* Visor Glass */}
        <path
          d="M50 32 C78 32, 85 40, 85 48 C85 58, 75 62, 50 62 C38 62, 42 32, 50 32 Z"
          fill="#38bdf8"
          stroke="#000000"
          strokeWidth="5"
        />
        {/* Visor Highlight */}
        <ellipse cx="64" cy="42" rx="12" ry="5" fill="#f0f9ff" transform="rotate(-10 64 42)" opacity="0.85" />

        {isDead && (
          <path
            d="M35 30 L65 70 M65 30 L35 70"
            stroke="#ef4444"
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
