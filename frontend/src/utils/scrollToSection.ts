/**
 * Shared utility for accessible, smooth in-page navigation scrolling.
 *
 * Requirements:
 * - Waits for React state updates to commit into the DOM (via requestAnimationFrame)
 * - Scrolls target element into view with smooth behavior (or instant if prefers-reduced-motion is active)
 * - Applies CSS scroll-margin-top to prevent sticky header occlusion
 * - Transfers keyboard focus to the target element (tabIndex -1)
 * - Optionally focuses the first empty input field within the target section
 */

export interface ScrollToSectionOptions {
  /** If true, moves focus to the first empty input/select/textarea within target (or first input if all filled) */
  focusFirstEmptyInput?: boolean;
  /** Whether to focus the target heading/section itself (default: true) */
  focusTarget?: boolean;
  /** Custom scrollMarginTop override (e.g. '5.5rem', '88px'). Defaults to '5.5rem' if not already set */
  scrollMarginTop?: string;
  /** Force scroll behavior if needed */
  behavior?: ScrollBehavior;
  /** Callback fired after scrolling and focus transfer */
  onScrolled?: (element: HTMLElement) => void;
}

export function scrollToSection(
  target: string | HTMLElement | React.RefObject<HTMLElement> | null | undefined,
  options: ScrollToSectionOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const {
    focusFirstEmptyInput = false,
    focusTarget = true,
    scrollMarginTop = '5.5rem',
    behavior: behaviorOverride,
    onScrolled,
  } = options;

  // Wait for React state commit and layout paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      let element: HTMLElement | null = null;

      if (typeof target === 'string') {
        element = document.getElementById(target);
      } else if (target && 'current' in target) {
        element = target.current;
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (!element) return;

      // Check prefers-reduced-motion media query
      let prefersReducedMotion = false;
      try {
        prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        prefersReducedMotion = false;
      }

      const behavior: ScrollBehavior = behaviorOverride ?? (prefersReducedMotion ? 'auto' : 'smooth');

      // Ensure CSS scroll-margin-top is present so sticky navbar does not occlude heading
      if (!element.style.scrollMarginTop && !element.className.includes('scroll-mt-')) {
        element.style.scrollMarginTop = scrollMarginTop;
      }

      // Perform scroll
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior, block: 'start' });
      }

      // Handle input focus if requested
      if (focusFirstEmptyInput) {
        const inputs = Array.from(
          element.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        );

        const firstEmpty = inputs.find((inp) => !inp.value || inp.value.trim() === '');
        if (firstEmpty) {
          firstEmpty.focus();
          onScrolled?.(element);
          return;
        } else if (inputs.length > 0) {
          inputs[0].focus();
          onScrolled?.(element);
          return;
        }
      }

      // Transfer focus to the target heading / container for keyboard accessibility
      if (focusTarget) {
        if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1');
        }
        try {
          element.focus({ preventScroll: true });
        } catch {
          element.focus();
        }
      }

      onScrolled?.(element);
    });
  });
}

export default scrollToSection;
