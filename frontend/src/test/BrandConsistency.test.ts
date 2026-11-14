import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Allowed internal technical identifiers and their reasons
const ALLOWED_INTERNAL_IDENTIFIERS: Record<string, string> = {
  agrisage_token: 'Preserved localStorage JWT auth key so existing farmers are not logged out',
  agrisage_user: 'Preserved localStorage user profile cache',
  agrisage_active_farm_id: 'Preserved localStorage selected farm ID across navigations',
  agrisage_active_farm: 'Preserved localStorage cached active farm details',
  agrisage_last_irrigation_plan: 'Preserved localStorage cached FAO-56 irrigation plan',
  agrisage_location: 'Preserved localStorage cached GPS coordinate payload',
  agrisage_active_crop: 'Preserved localStorage active crop name',
  agrisage_tour_completed_v1: 'Preserved localStorage flag for guided tour completion',
  agrisage_visual_choice_v1: 'Preserved localStorage choice between words and pictorial modes',
  agrisage_sidebar_collapsed: 'Preserved localStorage sidebar layout state',
  agrisage_pictorial_mode: 'Preserved localStorage pictorial UI mode toggle',
  agrisage_always_show_listen: 'Preserved localStorage persistent TTS listen button toggle',
  agrisage_theme: 'Preserved localStorage dark/light theme setting',
  agrisage_lang: 'Preserved localStorage language preference setting',
  'agrisage-command-palette-btn': 'Internal DOM element id for shortcut trigger',
  'agrisage:start-tour': 'Internal browser CustomEvent name for dispatching the guided tour',
  'agrisage-frontend': 'Package.json npm package name (internal package descriptor)',
  'agrisage.demo': 'Internal demo user account email domain (e.g., ramesh@agrisage.demo)',
  'agrisage.local': 'Internal UID suffix for calendar reminders',
};

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function stripAllowedIdentifiers(text: string): string {
  let cleaned = text;
  for (const ident of Object.keys(ALLOWED_INTERNAL_IDENTIFIERS)) {
    const regex = new RegExp(ident.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned;
}

describe('Brand Consistency & Yuktik Removal', () => {
  it('scans frontend/src, frontend/index.html, and frontend/public for AgriSage and Yuktik', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const frontendDir = path.join(rootDir, 'frontend');
    const indexHtmlPath = path.join(frontendDir, 'index.html');
    const srcDir = path.join(frontendDir, 'src');
    const publicDir = path.join(frontendDir, 'public');

    const filesToScan: string[] = [indexHtmlPath];
    if (fs.existsSync(srcDir)) filesToScan.push(...getAllFiles(srcDir));
    if (fs.existsSync(publicDir)) filesToScan.push(...getAllFiles(publicDir));

    const violations: string[] = [];

    filesToScan.forEach((filePath) => {
      if (filePath.endsWith('BrandConsistency.test.ts')) return;
      const ext = path.extname(filePath).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.ico', '.svg', '.lock'].includes(ext)) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const cleaned = stripAllowedIdentifiers(line);
        if (/agrisage|yuktik/i.test(cleaned)) {
          violations.push(`${path.relative(rootDir, filePath)}:${idx + 1}: ${line.trim()}`);
        }
      });
    });

    expect(
      violations,
      `Found ${violations.length} user-visible brand violations:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
