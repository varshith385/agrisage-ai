import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollToSection } from '../scrollToSection';

describe('scrollToSection shared utility', () => {
  let mockScrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockScrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView as any;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waits for RAF, scrolls target into view with smooth behavior by default, and sets tabIndex', async () => {
    const section = document.createElement('section');
    section.id = 'test-section';
    document.body.appendChild(section);

    scrollToSection('test-section');

    // Wait for nested RAFs
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(section.getAttribute('tabindex')).toBe('-1');
    expect(section.style.scrollMarginTop).toBe('5.5rem');
  });

  it('uses instant behavior (auto) when prefers-reduced-motion is active', async () => {
    const section = document.createElement('div');
    section.id = 'reduced-motion-section';
    document.body.appendChild(section);

    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;

    scrollToSection('reduced-motion-section');

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('focuses the first empty input when focusFirstEmptyInput is true', async () => {
    const container = document.createElement('div');
    container.id = 'form-container';

    const input1 = document.createElement('input');
    input1.value = '50';
    const input2 = document.createElement('input');
    input2.value = ''; // empty!
    const input3 = document.createElement('input');
    input3.value = '';

    container.appendChild(input1);
    container.appendChild(input2);
    container.appendChild(input3);
    document.body.appendChild(container);

    const focusSpy = vi.spyOn(input2, 'focus');

    scrollToSection('form-container', { focusFirstEmptyInput: true });

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(focusSpy).toHaveBeenCalled();
  });
});
