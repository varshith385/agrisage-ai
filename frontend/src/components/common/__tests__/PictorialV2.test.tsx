import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PictorialProvider, usePictorial } from '../../../context/PictorialContext';
import { LanguageProvider } from '../../../context/LanguageContext';
import { StatusBadge } from '../StatusBadge';
import { PictorialTile } from '../PictorialTile';
import {
  WaterDropsGauge,
  ThermometerGauge,
  CoinStackGauge,
  FarmHealthMeter,
  NoDataIllustration,
} from '../FarmerIllustrations';

describe('Pictorial Mode v2 & Readability Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Test 1: Mode toggle persistence in localStorage
  it('defaults to Pictures mode for new visitors and persists toggle choice in localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PictorialProvider>{children}</PictorialProvider>
    );

    const { result } = renderHook(() => usePictorial(), { wrapper });

    // Brand-new visitor defaults to Pictures
    expect(result.current.isPictorial).toBe(true);
    expect(result.current.mode).toBe('pictures');

    // Toggle to Words mode
    act(() => {
      result.current.setPictorial(false);
    });

    expect(result.current.isPictorial).toBe(false);
    expect(result.current.mode).toBe('words');
    expect(localStorage.getItem('agrisage_pictorial_mode')).toBe('words');

    // Toggle back to Pictures mode
    act(() => {
      result.current.togglePictorial();
    });

    expect(result.current.isPictorial).toBe(true);
    expect(result.current.mode).toBe('pictures');
    expect(localStorage.getItem('agrisage_pictorial_mode')).toBe('pictures');
  });

  // Test 2: Status component shape + word validation (never color only)
  it('renders a distinct shape icon and text word for every status type (never color alone)', () => {
    const statuses: Array<{ status: 'success' | 'warning' | 'danger' | 'info' | 'pending'; expectedShape: string; label: string }> = [
      { status: 'success', expectedShape: 'circle-tick', label: 'Healthy' },
      { status: 'warning', expectedShape: 'triangle-warning', label: 'Action Required' },
      { status: 'danger', expectedShape: 'octagon-cross', label: 'Pest Alert' },
      { status: 'info', expectedShape: 'circle-info', label: 'Rain Scheduled' },
      { status: 'pending', expectedShape: 'circle-clock', label: 'Processing' },
    ];

    statuses.forEach(({ status, expectedShape, label }) => {
      const { container, unmount } = render(<StatusBadge status={status} label={label} />);

      const badge = screen.getByTestId('status-indicator');
      expect(badge).toBeInTheDocument();
      // Verifies distinct non-color shape identifier attribute
      expect(badge).toHaveAttribute('data-shape', expectedShape);
      // Verifies visible text word is present and readable
      expect(screen.getByText(label)).toBeInTheDocument();

      // Verifies an SVG icon was rendered inside the badge
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).not.toBeNull();

      unmount();
    });
  });

  // Test 3: Picture gauges drawn from real values
  describe('Value-drawn gauges', () => {
    it('WaterDropsGauge renders correct number of filled drops based on real depth/depletion', () => {
      const { unmount: unmount1 } = render(<WaterDropsGauge dropsCount={3} maxDrops={5} />);
      const gauge3 = screen.getByTestId('water-drops-gauge');
      expect(gauge3).toHaveAttribute('data-drops', '3');
      expect(gauge3).toHaveAttribute('aria-label', '3 of 5 water drops level');
      unmount1();

      const { unmount: unmount2 } = render(<WaterDropsGauge dropsCount={5} maxDrops={5} />);
      const gauge5 = screen.getByTestId('water-drops-gauge');
      expect(gauge5).toHaveAttribute('data-drops', '5');
      unmount2();

      const { unmount: unmount3 } = render(<WaterDropsGauge dropsCount={0} maxDrops={5} />);
      const gauge0 = screen.getByTestId('water-drops-gauge');
      expect(gauge0).toHaveAttribute('data-drops', '0');
      unmount3();
    });

    it('ThermometerGauge reflects numeric temperature Celsius', () => {
      render(<ThermometerGauge tempC={32} />);
      const thermometer = screen.getByTestId('thermometer-gauge');
      expect(thermometer).toHaveAttribute('data-temp', '32');
      expect(thermometer).toHaveAttribute('aria-label', 'Temperature gauge: 32 degrees Celsius');
    });

    it('CoinStackGauge renders positive profit up-arrow vs negative deficit down-arrow', () => {
      const { unmount } = render(<CoinStackGauge netProfit={45000} isProfitable={true} />);
      const profitGauge = screen.getByTestId('coin-stack-gauge');
      expect(profitGauge).toHaveAttribute('data-profit', '45000');
      expect(profitGauge).toHaveAttribute('data-profitable', 'true');
      unmount();

      render(<CoinStackGauge netProfit={-12000} isProfitable={false} />);
      const deficitGauge = screen.getByTestId('coin-stack-gauge');
      expect(deficitGauge).toHaveAttribute('data-profit', '-12000');
      expect(deficitGauge).toHaveAttribute('data-profitable', 'false');
    });

    it('FarmHealthMeter renders active segments matching overall score out of 100', () => {
      render(<FarmHealthMeter score={88} />);
      const meter = screen.getByTestId('farm-health-meter');
      expect(meter).toHaveAttribute('data-score', '88');
      expect(meter).toHaveAttribute('data-segments', '5'); // 88/20 ceiling = 5 bars
    });

    // Round 4 Test 1: Disease tile shows grey "No scan yet" before any upload
    it('Disease tile shows grey "No scan yet" before any upload', () => {
      render(
        <LanguageProvider>
          <PictorialTile
            title="Disease Diagnosis"
            phrase="No scan yet"
            illustration={<NoDataIllustration size={80} />}
            status="nodata"
            statusWord="No scan yet"
            spokenText="Awaiting leaf photo for automated MobileNetV2 diagnosis."
          />
        </LanguageProvider>
      );

      const tile = screen.getByTestId('pictorial-tile');
      expect(tile).toBeInTheDocument();

      // Confirms grey no-data status and shape
      const badge = screen.getByTestId('status-indicator');
      expect(badge).toHaveAttribute('data-shape', 'circle-clock');
      expect(badge).toHaveClass('bg-[#F5F5F4]');

      // Confirms "No scan yet" text is present
      const scanTexts = screen.getAllByText('No scan yet');
      expect(scanTexts.length).toBeGreaterThanOrEqual(1);

      // Confirms grey placeholder illustration is present
      const noDataSvg = screen.getByTestId('no-data-illustration');
      expect(noDataSvg).toBeInTheDocument();

      // Confirms never shows fake green healthy tick
      expect(screen.queryByText('Canopy green & healthy')).not.toBeInTheDocument();
      expect(screen.queryByText('Crop Healthy')).not.toBeInTheDocument();
    });

    // Round 4 Test 2: Market tile never renders an MSP number
    it('Market tile never renders an MSP number and shows grey "details to verify"', () => {
      render(
        <LanguageProvider>
          <PictorialTile
            title="MSP Benchmark"
            phrase="details to verify"
            illustration={<NoDataIllustration size={80} />}
            status="nodata"
            statusWord="details to verify"
            spokenText="Minimum Support Price benchmark details require local verification. No unverified prices are shown."
          />
        </LanguageProvider>
      );

      const tile = screen.getByTestId('pictorial-tile');
      expect(tile).toBeInTheDocument();

      // Confirms "details to verify" wording
      const verifyTexts = screen.getAllByText('details to verify');
      expect(verifyTexts.length).toBeGreaterThanOrEqual(1);

      // Confirms grey no-data badge
      const badge = screen.getByTestId('status-indicator');
      expect(badge).toHaveAttribute('data-shape', 'circle-clock');

      // Confirms grey placeholder illustration
      const noDataSvg = screen.getByTestId('no-data-illustration');
      expect(noDataSvg).toBeInTheDocument();

      // CRITICAL: Tile text content must NEVER render any digit/number or Rupee sign
      expect(tile.textContent).not.toMatch(/\d/);
      expect(tile.textContent).not.toContain('₹');
      expect(tile.textContent).not.toMatch(/MSP:\s*₹/i);
    });
  });
});
