/**
 * AgriSage AI — Unified Design Tokens (Phase B Accessibility & Contrast Overhaul)
 * 
 * Strict WCAG AAA/AA Compliant Agricultural Palette:
 * - Primary (Deep Field Green): #1B5E3B (Headers, main action buttons, active navigation)
 * - Page Background:           #FFFDF8 (Warm readable off-white)
 * - Cards:                     #FFFFFF with 1px border #D9D4C7 & soft shadow
 * - Body Text:                 #1F2A24 (Near-black, >= 14:1 contrast on white/cream)
 * - Secondary Text:            #4A5750 (Never lighter than this, >= 7.4:1 contrast)
 * - Water Accent:              #1565A8 (Irrigation, rain, water budgeting)
 * - Sun/Highlight Accent:      #F2B01E (Amber highlight — ALWAYS dark text #1F2A24, never white text)
 * - Soil Accent:               #7A553A (Loam brown for soil icons & accents only)
 * - Status Colours:
 *   - Success:                 #2E7D32 (Shape: Circle with Checkmark)
 *   - Warning:                 #9E5B00 (Shape: Triangle with Alert — tuned for >= 4.5:1 text)
 *   - Danger:                  #B3261E (Shape: Octagon with Cross)
 *   - Info:                    #1565A8 (Shape: Circle with Info)
 * 
 * Typography & Interaction Rules:
 * - Body text: at least 18px (leading >= 1.5)
 * - Key numbers: at least 28px
 * - Buttons: at least 56px height with visible icons
 * - Minimum font size across entire app: 14px (no tiny 10px/11px text)
 * - Short sentences, no long paragraphs, no all-caps blocks
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
  },
  typography: {
    baseBody: 'text-[18px] leading-[1.6] text-[#1F2A24]',
    statNumber: 'font-display text-[28px] sm:text-[34px] font-extrabold text-[#1F2A24] tracking-tight leading-none',
    pageTitle: 'font-display text-[26px] sm:text-[32px] font-bold text-[#1B5E3B] tracking-tight leading-snug',
    sectionTitle: 'font-display text-[20px] sm:text-[24px] font-bold text-[#1B5E3B] leading-snug',
    plainText: 'text-[18px] text-[#4A5750] leading-[1.6]',
    label: 'text-[15px] font-bold text-[#1F2A24]',
    caption: 'text-[14px] font-medium text-[#4A5750] leading-normal',
  },
  classes: {
    card: 'bg-white rounded-2xl border border-[#D9D4C7] shadow-sm p-5 sm:p-6 transition-all hover:border-[#1B5E3B]/40',
    cardAmber: 'bg-gradient-to-br from-[#FFFDF8] to-[#FFF8E1] rounded-2xl border-2 border-[#F2B01E] shadow-sm p-5 sm:p-6',
    cardWater: 'bg-gradient-to-br from-[#FFFDF8] to-[#E3F2FD] rounded-2xl border-2 border-[#1565A8] shadow-sm p-5 sm:p-6',
    cardHighlight: 'bg-gradient-to-br from-[#FFFDF8] to-[#E8F5E9] rounded-2xl border-2 border-[#1B5E3B] shadow-sm p-5 sm:p-6',
    
    // Tap target & Button primitives (minimum 56px height, visible icon)
    tapTarget: 'min-h-[56px] min-w-[56px]',
    btnPrimary: 'min-h-[56px] px-6 py-3.5 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#154E30] shadow-sm flex items-center justify-center gap-2.5 transition-all text-[17px] active:scale-[0.98] focus:ring-2 focus:ring-[#1B5E3B] focus:ring-offset-2',
    btnAmber: 'min-h-[56px] px-6 py-3.5 rounded-2xl font-bold bg-[#F2B01E] text-[#1F2A24] hover:bg-[#E09F14] shadow-sm flex items-center justify-center gap-2.5 transition-all text-[17px] active:scale-[0.98] focus:ring-2 focus:ring-[#F2B01E] focus:ring-offset-2',
    btnWater: 'min-h-[56px] px-6 py-3.5 rounded-2xl font-bold bg-[#1565A8] text-white hover:bg-[#0E4F85] shadow-sm flex items-center justify-center gap-2.5 transition-all text-[17px] active:scale-[0.98] focus:ring-2 focus:ring-[#1565A8] focus:ring-offset-2',
    btnSecondary: 'min-h-[56px] px-5 py-3.5 rounded-2xl font-bold bg-[#FFFDF8] text-[#1B5E3B] border-2 border-[#1B5E3B] hover:bg-[#1B5E3B]/5 flex items-center justify-center gap-2.5 transition-all text-[17px] active:scale-[0.98]',
    
    // Inputs (minimum 56px height, readable text)
    input: 'min-h-[56px] w-full px-4 py-3 rounded-2xl border-2 border-[#D9D4C7] bg-white text-[17px] text-[#1F2A24] placeholder:text-[#4A5750]/70 focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] focus:border-[#1B5E3B] transition-all',
    
    // Status Badges (Always shape + text, never color only)
    badgeSuccess: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[14px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30',
    badgeWarning: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[14px] font-bold bg-[#FFF8E1] text-[#9E5B00] border border-[#9E5B00]/30',
    badgeDanger: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[14px] font-bold bg-[#FFEBEE] text-[#B3261E] border border-[#B3261E]/30',
    badgeInfo: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[14px] font-bold bg-[#E3F2FD] text-[#1565A8] border border-[#1565A8]/30',
  },
} as const;
