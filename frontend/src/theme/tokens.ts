/**
 * AgriSage AI — Unified Design Tokens
 * 
 * Palette:
 * - Deep Green: #183D2E (Primary brand, headers, active states)
 * - Amber:      #DA9A4C (Accents, key numbers, primary CTAs)
 * - Brown:      #7A553A (Soil / earth, borders, secondary accents)
 * - Off-White:  #FAF8F5 (Page background, warm surfaces)
 * 
 * Rules:
 * - Readable base font size: >= 16px body, >= 18px key numbers
 * - Tap targets: >= 48px
 * - Strong contrast: no tiny low-contrast grey text
 * - Unified Card, Button, and Header styles across all pages
 */

export const TOKENS = {
  colors: {
    primary: '#183D2E',
    primaryLight: '#265C46',
    primaryDark: '#0E241B',
    amber: '#DA9A4C',
    amberLight: '#F5C989',
    amberDark: '#B87B2E',
    brown: '#7A553A',
    brownLight: '#A37754',
    brownDark: '#543924',
    cream: '#FAF8F5',
    creamDark: '#F0EBE1',
    textDark: '#1A2421',
    textMuted: '#4E5F57',
    border: 'rgba(122, 85, 58, 0.20)',
    borderHover: 'rgba(24, 61, 46, 0.40)',
  },
  typography: {
    baseBody: 'text-base text-[#1A2421]',
    statNumber: 'font-display text-xl sm:text-2xl font-bold text-[#183D2E]',
    pageTitle: 'font-display text-2xl sm:text-3xl font-bold text-[#183D2E] tracking-tight',
    sectionTitle: 'font-display text-lg sm:text-xl font-bold text-[#183D2E]',
    plainText: 'text-base text-[#4E5F57] leading-relaxed',
    label: 'text-sm font-semibold text-[#183D2E]',
  },
  classes: {
    // Card Primitive: clean official agriculture card
    card: 'bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm p-5 sm:p-6 transition-all hover:border-[#183D2E]/35',
    cardAmber: 'bg-gradient-to-br from-[#FAF8F5] to-[#FEF6E9] rounded-2xl border border-[#DA9A4C]/35 shadow-sm p-5 sm:p-6',
    cardHighlight: 'bg-gradient-to-br from-[#FAF8F5] to-[#E4EDE8] rounded-2xl border border-[#183D2E]/25 shadow-sm p-5 sm:p-6',
    
    // Tap target guarantee (at least 48px height)
    tapTarget: 'min-h-[48px] min-w-[48px]',
    
    // Buttons: at least 48px height, strong contrast, rounded-xl
    btnPrimary: 'min-h-[48px] px-6 py-3 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:ring-2 focus:ring-[#183D2E] focus:ring-offset-2',
    btnAmber: 'min-h-[48px] px-6 py-3 rounded-xl font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:ring-2 focus:ring-[#DA9A4C] focus:ring-offset-2',
    btnSecondary: 'min-h-[48px] px-5 py-3 rounded-xl font-semibold bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/30 hover:bg-[#F0EBE1] flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
    btnOutline: 'min-h-[48px] px-5 py-3 rounded-xl font-semibold bg-transparent text-[#183D2E] border-2 border-[#183D2E] hover:bg-[#183D2E]/5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
    
    // Inputs: at least 48px height, clear borders, readable 16px text
    input: 'min-h-[48px] w-full px-4 py-2.5 rounded-xl border border-[#7A553A]/30 bg-white text-base text-[#1A2421] placeholder:text-[#4E5F57]/60 focus:outline-none focus:ring-2 focus:ring-[#183D2E] focus:border-[#183D2E] transition-all',
    
    // Badges
    badgeHonesty: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF6E9] text-[#7A553A] border border-[#DA9A4C]/30',
    badgeLive: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E4EDE8] text-[#183D2E] border border-[#183D2E]/25',
    badgeModelled: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#543924] border border-[#7A553A]/30',
  },
} as const;
