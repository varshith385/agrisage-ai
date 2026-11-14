/**
 * AgriSage AI — Unified Design Tokens (Round 5 Professional Visual System & Dark Mode)
 * 
 * Strict WCAG AAA/AA Compliant Agricultural Palette:
 * - Primary (Deep Field Green): #1B5E3B (Headers, main action buttons, active navigation)
 * - Page Background Light:     #FFFDF8 (Warm readable off-white)
 * - Page Background Dark:      #0D1410 (Deep organic slate-green)
 * - Card Background Light:     #FFFFFF with 1px border #D9D4C7 & soft shadow
 * - Card Background Dark:      #18241E with 1px border #273B30
 * - Body Text Light:           #1F2A24 (>= 14:1 contrast on white/cream)
 * - Body Text Dark:            #F2F5F3 (>= 15:1 contrast on dark surface)
 * - Secondary Text Light:      #4A5750 (>= 7.4:1 contrast on white/cream)
 * - Secondary Text Dark:       #9EB0A5 (>= 7.2:1 contrast on dark surface)
 * - Water Accent:              #1565A8 (Light) / #38BDF8 (Dark)
 * - Sun/Highlight Accent:      #F2B01E (Amber highlight — ALWAYS dark text on light, high contrast)
 * - Soil Accent:               #7A553A (Brown for soil icons & accents only)
 * - Status Colours (Light / Dark):
 *   - Success:                 #2E7D32 / #4ADE80 (Shape: Circle with Checkmark)
 *   - Warning:                 #9E5B00 / #FBBF24 (Shape: Triangle with Alert)
 *   - Danger:                  #B3261E / #F87171 (Shape: Octagon with Cross)
 *   - Info:                    #1565A8 / #60A5FA (Shape: Circle with Info)
 * 
 * Round 5 Professional Type Scale:
 * - Body:        15px to 16px (leading 1.5, 1.7 for Indic scripts)
 * - Secondary:   13px to 14px
 * - Card Titles: 16px to 18px font-bold
 * - Page Titles: 24px to 28px font-bold
 * - KPI Numbers: 28px to 32px font-black (only on KPI summary cards)
 */

export const TOKENS = {
  colors: {
    primary: '#1B5E3B',
    primaryDark: '#0F3B24',
    primaryLight: '#267A4E',
    bg: '#FFFDF8',
    card: '#FFFFFF',
    cardBorder: '#D9D4C7',
    text: '#1F2A24',
    textSecondary: '#4A5750',
    water: '#1565A8',
    amber: '#F2B01E',
    soil: '#7A553A',
    success: '#2E7D32',
    warning: '#9E5B00',
    danger: '#B3261E',
    info: '#1565A8',

    // Dark Mode tokens
    darkBg: '#0D1410',
    darkSurface: '#18241E',
    darkBorder: '#273B30',
    darkText: '#F2F5F3',
    darkTextSecondary: '#9EB0A5',
    darkWater: '#38BDF8',
    darkSuccess: '#4ADE80',
    darkWarning: '#FBBF24',
    darkDanger: '#F87171',
    darkInfo: '#60A5FA',
  },
  typography: {
    // Professional 15-16px body
    baseBody: 'text-[15px] sm:text-[16px] leading-[1.5] text-[#1F2A24] dark:text-[#F2F5F3]',
    statNumber: 'font-display text-[28px] sm:text-[32px] font-black text-[#1F2A24] dark:text-[#F2F5F3] tracking-tight leading-none',
    pageTitle: 'font-display text-[24px] sm:text-[28px] font-bold text-[#1B5E3B] dark:text-[#F2F5F3] tracking-tight leading-snug break-words',
    sectionTitle: 'font-display text-[18px] sm:text-[20px] font-bold text-[#1B5E3B] dark:text-[#F2B01E] leading-snug break-words',
    cardTitle: 'text-[16px] sm:text-[18px] font-bold text-[#1F2A24] dark:text-[#F2F5F3] leading-snug break-words',
    plainText: 'text-[15px] sm:text-[16px] text-[#4A5750] dark:text-[#9EB0A5] leading-[1.5]',
    label: 'text-[14px] font-bold text-[#1F2A24] dark:text-[#F2F5F3]',
    caption: 'text-[13px] sm:text-[14px] font-medium text-[#4A5750] dark:text-[#9EB0A5] leading-normal',
  },
  classes: {
    card: 'bg-white dark:bg-[#18241E] rounded-2xl border border-[#D9D4C7] dark:border-[#273B30] shadow-xs p-4 sm:p-5 transition-all hover:border-[#1B5E3B]/40 dark:hover:border-[#F2B01E]/40',
    cardAmber: 'bg-gradient-to-br from-[#FFFDF8] to-[#FFF8E1] dark:from-[#18241E] dark:to-[#232014] rounded-2xl border-2 border-[#F2B01E] shadow-xs p-4 sm:p-5',
    cardWater: 'bg-gradient-to-br from-[#FFFDF8] to-[#E3F2FD] dark:from-[#18241E] dark:to-[#122331] rounded-2xl border-2 border-[#1565A8] dark:border-[#38BDF8] shadow-xs p-4 sm:p-5',
    cardHighlight: 'bg-gradient-to-br from-[#FFFDF8] to-[#E8F5E9] dark:from-[#18241E] dark:to-[#142B1D] rounded-2xl border-2 border-[#1B5E3B] shadow-xs p-4 sm:p-5',
    
    // Tap target & Button primitives (balanced 46-50px height)
    tapTarget: 'min-h-[48px] min-w-[48px]',
    btnPrimary: 'min-h-[46px] px-5 py-2.5 rounded-xl font-bold bg-[#1B5E3B] text-white hover:bg-[#154E30] shadow-xs flex items-center justify-center gap-2 transition-all text-[15px] active:scale-[0.98] focus:ring-2 focus:ring-[#1B5E3B]',
    btnAmber: 'min-h-[46px] px-5 py-2.5 rounded-xl font-bold bg-[#F2B01E] text-[#1F2A24] hover:bg-[#E09F14] shadow-xs flex items-center justify-center gap-2 transition-all text-[15px] active:scale-[0.98] focus:ring-2 focus:ring-[#F2B01E]',
    btnWater: 'min-h-[46px] px-5 py-2.5 rounded-xl font-bold bg-[#1565A8] text-white hover:bg-[#0E4F85] shadow-xs flex items-center justify-center gap-2 transition-all text-[15px] active:scale-[0.98] focus:ring-2 focus:ring-[#1565A8]',
    btnSecondary: 'min-h-[46px] px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-[#18241E] text-[#1B5E3B] dark:text-[#F2B01E] border border-[#D9D4C7] dark:border-[#273B30] hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center gap-2 transition-all text-[15px] active:scale-[0.98]',
    
    // Inputs (46-48px height, readable text)
    input: 'min-h-[46px] w-full px-3.5 py-2.5 rounded-xl border border-[#D9D4C7] dark:border-[#273B30] bg-white dark:bg-[#121B16] text-[15px] text-[#1F2A24] dark:text-[#F2F5F3] placeholder:text-[#4A5750]/60 dark:placeholder:text-[#9EB0A5]/60 focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] focus:border-[#1B5E3B] transition-all',
    
    // Status Badges (Always shape + text, never color only)
    badgeSuccess: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#E8F5E9] dark:bg-[#1B3825] text-[#2E7D32] dark:text-[#4ADE80] border border-[#2E7D32]/30 dark:border-[#4ADE80]/30',
    badgeWarning: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#FFF8E1] dark:bg-[#34270B] text-[#9E5B00] dark:text-[#FBBF24] border border-[#9E5B00]/30 dark:border-[#FBBF24]/30',
    badgeDanger: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#FFEBEE] dark:bg-[#3A1414] text-[#B3261E] dark:text-[#F87171] border border-[#B3261E]/30 dark:border-[#F87171]/30',
    badgeInfo: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#E3F2FD] dark:bg-[#122B3F] text-[#1565A8] dark:text-[#60A5FA] border border-[#1565A8]/30 dark:border-[#60A5FA]/30',
    badgeNodata: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#F5F5F4] dark:bg-stone-800 text-[#4A5750] dark:text-[#9EB0A5] border border-[#D9D4C7] dark:border-[#273B30]',
  },
} as const;
