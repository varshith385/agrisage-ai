import React from 'react';

interface SvgProps {
  className?: string;
  size?: number;
}

/**
 * Original SVG: Taking a photo of a crop leaf with a mobile phone.
 */
export const LeafScanIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft background circle */}
    <circle cx="60" cy="60" r="54" fill="#FAF8F5" stroke="#7A553A" strokeWidth="2" strokeDasharray="3 3" />
    
    {/* Crop leaf */}
    <path
      d="M32 75 C30 45, 60 30, 85 35 C80 60, 65 90, 32 75 Z"
      fill="#265C46"
      stroke="#183D2E"
      strokeWidth="2.5"
    />
    {/* Leaf central vein */}
    <path d="M35 73 Q 60 55 82 37" stroke="#FAF8F5" strokeWidth="2" strokeLinecap="round" />
    <path d="M48 64 Q 55 60 58 52" stroke="#FAF8F5" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M60 56 Q 68 53 71 45" stroke="#FAF8F5" strokeWidth="1.5" strokeLinecap="round" />

    {/* Phone frame scanning */}
    <rect x="52" y="42" width="46" height="64" rx="8" fill="#183D2E" stroke="#DA9A4C" strokeWidth="2" />
    <rect x="56" y="48" width="38" height="50" rx="4" fill="#FAF8F5" />
    {/* Viewfinder crosshairs */}
    <path d="M64 54 H60 V58" stroke="#DA9A4C" strokeWidth="2" strokeLinecap="round" />
    <path d="M86 54 H90 V58" stroke="#DA9A4C" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 92 H60 V88" stroke="#DA9A4C" strokeWidth="2" strokeLinecap="round" />
    <path d="M86 92 H90 V88" stroke="#DA9A4C" strokeWidth="2" strokeLinecap="round" />
    <circle cx="75" cy="73" r="8" stroke="#DA9A4C" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

/**
 * Original SVG: Watering the field / irrigation budget.
 */
export const WateringFieldIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Background */}
    <circle cx="60" cy="60" r="54" fill="#FAF8F5" stroke="#7A553A" strokeWidth="2" strokeDasharray="3 3" />
    
    {/* Soil layers */}
    <path d="M15 88 Q 60 84 105 88 L 105 105 Q 60 108 15 105 Z" fill="#7A553A" />
    <path d="M20 92 Q 60 90 100 92" stroke="#543924" strokeWidth="2" strokeDasharray="4 4" />

    {/* Growing plant */}
    <path d="M60 88 V 55" stroke="#183D2E" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M60 70 C 45 68 40 55 45 52 C 55 52 58 65 60 70 Z" fill="#265C46" stroke="#183D2E" strokeWidth="2" />
    <path d="M60 62 C 75 60 80 48 75 45 C 65 45 62 58 60 62 Z" fill="#265C46" stroke="#183D2E" strokeWidth="2" />

    {/* Water drops falling */}
    <path d="M50 30 C 50 36 44 42 38 42 C 32 42 26 36 38 22 C 50 36 50 30 50 30 Z" fill="#3B82F6" opacity="0.85" />
    <path d="M72 26 C 72 32 67 37 62 37 C 57 37 52 32 62 20 C 72 32 72 26 72 26 Z" fill="#60A5FA" opacity="0.9" />
    <path d="M88 38 C 88 43 84 47 80 47 C 76 47 72 43 80 32 C 88 43 88 38 88 38 Z" fill="#3B82F6" opacity="0.8" />
  </svg>
);

/**
 * Original SVG: Weather forecast (Sun and Rain cloud).
 */
export const WeatherIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft background */}
    <circle cx="60" cy="60" r="54" fill="#FAF8F5" stroke="#7A553A" strokeWidth="2" strokeDasharray="3 3" />
    
    {/* Radiant Sun */}
    <circle cx="75" cy="45" r="20" fill="#DA9A4C" />
    <path d="M75 18 V 24" stroke="#DA9A4C" strokeWidth="3" strokeLinecap="round" />
    <path d="M95 28 L 91 32" stroke="#DA9A4C" strokeWidth="3" strokeLinecap="round" />
    <path d="M102 45 H 96" stroke="#DA9A4C" strokeWidth="3" strokeLinecap="round" />
    <path d="M95 62 L 91 58" stroke="#DA9A4C" strokeWidth="3" strokeLinecap="round" />

    {/* Cloud */}
    <path
      d="M32 75 C 25 75 20 70 20 63 C 20 57 24 53 29 52 C 30 43 38 36 47 36 C 55 36 62 42 64 49 C 67 48 70 48 72 50 C 76 53 78 57 78 62 C 78 69 72 75 65 75 Z"
      fill="#FFFFFF"
      stroke="#183D2E"
      strokeWidth="2.5"
    />

    {/* Gentle rain streaks */}
    <line x1="36" y1="83" x2="32" y2="93" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="48" y1="83" x2="44" y2="93" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="60" y1="83" x2="56" y2="93" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/**
 * Original SVG: Money / Net Profit / Economics.
 */
export const MoneyProfitIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Background */}
    <circle cx="60" cy="60" r="54" fill="#FAF8F5" stroke="#7A553A" strokeWidth="2" strokeDasharray="3 3" />
    
    {/* Harvest grain sack */}
    <path
      d="M35 55 C 35 48 42 45 50 45 L 70 45 C 78 45 85 48 85 55 L 88 95 C 88 100 80 104 60 104 C 40 104 32 100 32 95 Z"
      fill="#EFE7DE"
      stroke="#7A553A"
      strokeWidth="2.5"
    />
    {/* Sack tie rope */}
    <path d="M45 52 Q 60 56 75 52" stroke="#DA9A4C" strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="52" r="3" fill="#DA9A4C" />

    {/* Coin with Rupee Symbol */}
    <circle cx="76" cy="40" r="18" fill="#DA9A4C" stroke="#183D2E" strokeWidth="2" />
    <text x="76" y="47" textAnchor="middle" fill="#183D2E" fontSize="18" fontWeight="bold" fontFamily="sans-serif">₹</text>

    {/* Growth arrow */}
    <path d="M25 80 L 45 65 L 60 72 L 85 50" stroke="#183D2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M76 50 H 85 V 59" stroke="#183D2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Original SVG: Empty State (Quiet Soil with Seed Sprout).
 */
export const EmptyPlotIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="54" fill="#FAF8F5" stroke="#7A553A" strokeWidth="2" strokeDasharray="3 3" />
    <ellipse cx="60" cy="85" rx="35" ry="12" fill="#EFE7DE" stroke="#7A553A" strokeWidth="2" />
    <path d="M60 85 V 65" stroke="#183D2E" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 72 C 52 70 48 60 53 58 C 60 58 60 68 60 72 Z" fill="#265C46" stroke="#183D2E" strokeWidth="1.5" />
    <path d="M60 67 C 68 65 72 55 67 53 C 60 53 60 63 60 67 Z" fill="#DA9A4C" stroke="#183D2E" strokeWidth="1.5" />
  </svg>
);

/**
 * Original SVG: Explain / What Is This Info Guide.
 */
export const ExplainGuideIllustration: React.FC<SvgProps> = ({ className = 'w-20 h-20', size = 80 }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="18" y="15" width="64" height="74" rx="8" fill="#FAF8F5" stroke="#183D2E" strokeWidth="2.5" />
    <path d="M30 32 H 70" stroke="#7A553A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 44 H 62" stroke="#7A553A" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 54 H 55" stroke="#7A553A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="68" cy="66" r="14" fill="#DA9A4C" stroke="#183D2E" strokeWidth="2" />
    <text x="68" y="72" textAnchor="middle" fill="#0E241B" fontSize="16" fontWeight="bold">?</text>
  </svg>
);
