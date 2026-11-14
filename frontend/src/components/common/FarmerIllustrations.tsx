import React from 'react';

export interface SvgProps {
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
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    {/* Crop leaf */}
    <path
      d="M32 75 C30 45, 60 30, 85 35 C80 60, 65 90, 32 75 Z"
      fill="#267A4E"
      stroke="#1B5E3B"
      strokeWidth="2.5"
    />
    <path d="M35 73 Q 60 55 82 37" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" />
    <path d="M48 64 Q 55 60 58 52" stroke="#FFFDF8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M60 56 Q 68 53 71 45" stroke="#FFFDF8" strokeWidth="1.5" strokeLinecap="round" />

    {/* Phone frame */}
    <rect x="52" y="42" width="46" height="64" rx="8" fill="#1B5E3B" stroke="#F2B01E" strokeWidth="2" />
    <rect x="56" y="48" width="38" height="50" rx="4" fill="#FFFDF8" />
    {/* Viewfinder crosshairs */}
    <path d="M64 54 H60 V58" stroke="#F2B01E" strokeWidth="2" strokeLinecap="round" />
    <path d="M86 54 H90 V58" stroke="#F2B01E" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 92 H60 V88" stroke="#F2B01E" strokeWidth="2" strokeLinecap="round" />
    <path d="M86 92 H90 V88" stroke="#F2B01E" strokeWidth="2" strokeLinecap="round" />
    <circle cx="75" cy="73" r="8" stroke="#F2B01E" strokeWidth="1.5" strokeDasharray="2 2" />
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
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    {/* Soil layers */}
    <path d="M15 88 Q 60 84 105 88 L 105 105 Q 60 108 15 105 Z" fill="#7A553A" />
    {/* Plant */}
    <path d="M60 88 V 55" stroke="#1B5E3B" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M60 70 C 45 68 40 55 45 52 C 55 52 58 65 60 70 Z" fill="#2E7D32" stroke="#1B5E3B" strokeWidth="2" />
    <path d="M60 62 C 75 60 80 48 75 45 C 65 45 62 58 60 62 Z" fill="#2E7D32" stroke="#1B5E3B" strokeWidth="2" />
    {/* Water drops */}
    <path d="M50 30 C 50 36 44 42 38 42 C 32 42 26 36 38 22 C 50 36 50 30 50 30 Z" fill="#1565A8" opacity="0.9" />
    <path d="M72 26 C 72 32 67 37 62 37 C 57 37 52 32 62 20 C 72 32 72 26 72 26 Z" fill="#42A5F5" opacity="0.9" />
  </svg>
);

/**
 * Original SVG: Watering can for "Do this today".
 */
export const WateringCanIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    {/* Can body */}
    <path d="M38 52 L 44 90 C 44 94 48 96 52 96 H 76 C 80 96 84 94 84 90 L 90 52 Z" fill="#1565A8" stroke="#0D47A1" strokeWidth="2.5" />
    {/* Handle */}
    <path d="M38 58 C 22 58 20 84 38 86" stroke="#1565A8" strokeWidth="4" strokeLinecap="round" />
    {/* Spout */}
    <path d="M84 65 L 102 46" stroke="#1565A8" strokeWidth="5" strokeLinecap="round" />
    <circle cx="104" cy="44" r="5" fill="#F2B01E" stroke="#9E5B00" strokeWidth="1.5" />
    {/* Sprinkling drops */}
    <circle cx="108" cy="54" r="2.5" fill="#1565A8" />
    <circle cx="114" cy="48" r="2" fill="#1565A8" />
    <circle cx="104" cy="60" r="2" fill="#1565A8" />
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
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    {/* Radiant Sun */}
    <circle cx="75" cy="45" r="18" fill="#F2B01E" />
    <path d="M75 20 V 26" stroke="#F2B01E" strokeWidth="3" strokeLinecap="round" />
    <path d="M94 28 L 89 33" stroke="#F2B01E" strokeWidth="3" strokeLinecap="round" />
    <path d="M100 45 H 94" stroke="#F2B01E" strokeWidth="3" strokeLinecap="round" />

    {/* Cloud */}
    <path
      d="M32 75 C 25 75 20 70 20 63 C 20 57 24 53 29 52 C 30 43 38 36 47 36 C 55 36 62 42 64 49 C 67 48 70 48 72 50 C 76 53 78 57 78 62 C 78 69 72 75 65 75 Z"
      fill="#FFFFFF"
      stroke="#1B5E3B"
      strokeWidth="2.5"
    />
    {/* Rain drops */}
    <line x1="36" y1="83" x2="32" y2="93" stroke="#1565A8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="48" y1="83" x2="44" y2="93" stroke="#1565A8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="60" y1="83" x2="56" y2="93" stroke="#1565A8" strokeWidth="2.5" strokeLinecap="round" />
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
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    {/* Harvest grain sack */}
    <path
      d="M35 55 C 35 48 42 45 50 45 L 70 45 C 78 45 85 48 85 55 L 88 95 C 88 100 80 104 60 104 C 40 104 32 100 32 95 Z"
      fill="#F5ECE2"
      stroke="#7A553A"
      strokeWidth="2.5"
    />
    <path d="M45 52 Q 60 56 75 52" stroke="#F2B01E" strokeWidth="3" strokeLinecap="round" />

    {/* Coin with Rupee */}
    <circle cx="76" cy="40" r="18" fill="#F2B01E" stroke="#9E5B00" strokeWidth="2" />
    <text x="76" y="47" textAnchor="middle" fill="#1F2A24" fontSize="18" fontWeight="bold" fontFamily="sans-serif">₹</text>

    {/* Green growth arrow */}
    <path d="M25 80 L 45 65 L 60 72 L 85 50" stroke="#1B5E3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M76 50 H 85 V 59" stroke="#1B5E3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Original SVG: Empty State / No Data (Quiet soil).
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
    <circle cx="60" cy="60" r="54" fill="#FFFDF8" stroke="#D9D4C7" strokeWidth="2" />
    <ellipse cx="60" cy="85" rx="35" ry="12" fill="#F5ECE2" stroke="#7A553A" strokeWidth="2" />
    <path d="M60 85 V 65" stroke="#1B5E3B" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 72 C 52 70 48 60 53 58 C 60 58 60 68 60 72 Z" fill="#267A4E" stroke="#1B5E3B" strokeWidth="1.5" />
    <path d="M60 67 C 68 65 72 55 67 53 C 60 53 60 63 60 67 Z" fill="#F2B01E" stroke="#9E5B00" strokeWidth="1.5" />
  </svg>
);

/**
 * Original SVG: Grey "No Data" Placeholder (Honest representation, never fake).
 */
export const NoDataIllustration: React.FC<SvgProps> = ({ className = 'w-24 h-24', size = 96 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="54" fill="#F5F5F4" stroke="#D6D3D1" strokeWidth="2" />
    <rect x="36" y="36" width="48" height="48" rx="8" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="2" strokeDasharray="3 3" />
    <line x1="48" y1="60" x2="72" y2="60" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
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
    <rect x="18" y="15" width="64" height="74" rx="8" fill="#FFFDF8" stroke="#1B5E3B" strokeWidth="2.5" />
    <path d="M30 32 H 70" stroke="#7A553A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 44 H 62" stroke="#7A553A" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 54 H 55" stroke="#7A553A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="68" cy="66" r="14" fill="#F2B01E" stroke="#9E5B00" strokeWidth="2" />
    <text x="68" y="72" textAnchor="middle" fill="#1F2A24" fontSize="16" fontWeight="bold">?</text>
  </svg>
);

// -------------------------------------------------------------
// VALUE-DRAWN PICTORIAL GAUGES (Phase C v2)
// -------------------------------------------------------------

/**
 * Real-Value Water Drops Gauge (0 to 5 filled drops based on real mm / depletion)
 */
export const WaterDropsGauge: React.FC<{
  dropsCount: number; // 0 to 5
  maxDrops?: number;
  className?: string;
}> = ({ dropsCount, maxDrops = 5, className = 'w-36 h-10' }) => {
  const count = Math.max(0, Math.min(maxDrops, Math.round(dropsCount)));
  return (
    <div
      data-testid="water-drops-gauge"
      data-drops={count}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={`${count} of ${maxDrops} water drops level`}
    >
      {Array.from({ length: maxDrops }).map((_, i) => {
        const isFilled = i < count;
        return (
          <svg
            key={i}
            viewBox="0 0 24 32"
            className="w-6 h-8 shrink-0 transition-all"
            fill={isFilled ? '#1565A8' : '#D9D4C7'}
            stroke={isFilled ? '#0D47A1' : '#B0A898'}
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 2 C12 2, 2 15, 2 21 C2 26.5 6.5 31 12 31 C17.5 31 22 26.5 22 21 C22 15 12 2 12 2 Z" />
          </svg>
        );
      })}
    </div>
  );
};

/**
 * Real-Value Thermometer Gauge (proportional mercury fill)
 */
export const ThermometerGauge: React.FC<{
  tempC: number;
  className?: string;
}> = ({ tempC, className = 'w-12 h-28' }) => {
  // Normalize 10C to 45C into 10% to 90% fill
  const pct = Math.max(10, Math.min(95, ((tempC - 10) / 35) * 85 + 10));
  const fillY = 80 - (pct / 100) * 60;
  const fillColor = tempC > 36 ? '#B3261E' : tempC < 18 ? '#1565A8' : '#F2B01E';

  return (
    <svg
      viewBox="0 0 40 100"
      className={className}
      data-testid="thermometer-gauge"
      data-temp={tempC}
      aria-label={`Temperature gauge: ${tempC} degrees Celsius`}
    >
      {/* Outer tube */}
      <rect x="14" y="10" width="12" height="65" rx="6" fill="#FFFDF8" stroke="#7A553A" strokeWidth="2.5" />
      {/* Bulb */}
      <circle cx="20" cy="80" r="14" fill={fillColor} stroke="#7A553A" strokeWidth="2.5" />
      {/* Mercury Column */}
      <rect x="17" y={fillY} width="6" height={80 - fillY} rx="3" fill={fillColor} />
      {/* Tick lines */}
      <line x1="28" y1="25" x2="34" y2="25" stroke="#7A553A" strokeWidth="2" />
      <line x1="28" y1="40" x2="34" y2="40" stroke="#7A553A" strokeWidth="2" />
      <line x1="28" y1="55" x2="34" y2="55" stroke="#7A553A" strokeWidth="2" />
    </svg>
  );
};

/**
 * Real-Value Coin Stack Gauge (stack of coins + up/down arrow based on profit)
 */
export const CoinStackGauge: React.FC<{
  netProfit: number;
  isProfitable?: boolean;
  className?: string;
}> = ({ netProfit, isProfitable = netProfit >= 0, className = 'w-24 h-24' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      data-testid="coin-stack-gauge"
      data-profit={netProfit}
      data-profitable={isProfitable}
      aria-label={`Profit gauge: ${netProfit} Rupees`}
    >
      {/* Base coin stack */}
      <ellipse cx="42" cy="78" rx="26" ry="9" fill="#D4940E" stroke="#9E5B00" strokeWidth="2" />
      <ellipse cx="42" cy="70" rx="26" ry="9" fill="#F2B01E" stroke="#9E5B00" strokeWidth="2" />
      <ellipse cx="42" cy="62" rx="26" ry="9" fill="#F2B01E" stroke="#9E5B00" strokeWidth="2" />
      <ellipse cx="42" cy="54" rx="26" ry="9" fill="#F2B01E" stroke="#9E5B00" strokeWidth="2" />
      <ellipse cx="42" cy="46" rx="26" ry="9" fill="#FCE7B2" stroke="#9E5B00" strokeWidth="2" />
      <text x="42" y="50" textAnchor="middle" fill="#1F2A24" fontSize="11" fontWeight="bold">₹</text>

      {/* Prominent Profit / Loss Arrow */}
      {isProfitable ? (
        <g transform="translate(62, 18)">
          <circle cx="16" cy="16" r="16" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" />
          <path d="M16 23 V 9 M10 15 L 16 9 L 22 15" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        <g transform="translate(62, 18)">
          <circle cx="16" cy="16" r="16" fill="#FFEBEE" stroke="#B3261E" strokeWidth="2" />
          <path d="M16 9 V 23 M10 17 L 16 23 L 22 17" stroke="#B3261E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

/**
 * Real-Value Farm Health 5-Step Meter (1 to 5 steps)
 */
export const FarmHealthMeter: React.FC<{
  score: number; // 0 to 100
  className?: string;
}> = ({ score, className = 'w-36 h-12' }) => {
  // 5 segments: 1 to 5
  const activeSegments = Math.max(1, Math.min(5, Math.ceil(score / 20)));

  return (
    <div
      data-testid="farm-health-meter"
      data-score={score}
      data-segments={activeSegments}
      className={`flex items-center gap-1.5 ${className}`}
      aria-label={`Farm Health Meter: ${score} of 100 (${activeSegments} of 5 bars)`}
    >
      {[1, 2, 3, 4, 5].map((seg) => {
        const isActive = seg <= activeSegments;
        let colorClass = 'bg-[#D9D4C7]';
        if (isActive) {
          if (activeSegments >= 4) colorClass = 'bg-[#2E7D32]';
          else if (activeSegments === 3) colorClass = 'bg-[#F2B01E]';
          else colorClass = 'bg-[#B3261E]';
        }
        return (
          <div
            key={seg}
            className={`h-7 flex-1 rounded-md transition-all ${colorClass}`}
            style={{ height: `${16 + seg * 5}px` }}
          />
        );
      })}
    </div>
  );
};
