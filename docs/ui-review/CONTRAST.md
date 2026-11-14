# WCAG 2.1 Contrast Analysis & Palette Verification

This document verifies the color contrast ratios of the AgriSage AI design system for smallholder farmer accessibility.

## 1. Approved Palette Tokens

| Role | Color Name | Hex Code | Purpose |
|---|---|---|---|
| **Primary** | Deep Field Green | `#1B5E3B` | Headers, main action buttons, active navigation states |
| **Page Background** | Warm Off-White | `#FFFDF8` | Base background across desktop and mobile screens |
| **Cards** | Pure White | `#FFFFFF` | Card surfaces with 1px border `#D9D4C7` and soft shadow |
| **Body Text** | Near-Black | `#1F2A24` | Primary high-contrast reading text (18px base) |
| **Secondary Text** | Muted Moss Slate | `#4A5750` | Explanations, subtitles, parameter hints (never lighter) |
| **Water Accent** | Water Blue | `#1565A8` | Irrigation gauges, rainfall indicators, water budgeting CTAs |
| **Alert/Sun Accent** | Harvest Amber | `#F2B01E` | Highlights, "Do this today", urgent notices (**ALWAYS with near-black text**) |
| **Soil Accent** | Loam Brown | `#7A553A` | Soil texture indicators, seed/land accents (never for text on green) |
| **Card Border** | Muted Loam Tint | `#D9D4C7` | Clean 1px card boundaries |
| **Status: Success** | Forest Green | `#2E7D32` | Healthy crops, adequate moisture, profitable margins |
| **Status: Warning** | Deep Gold Ochre | `#9E5B00` | Depletion approaching threshold, spray delay (adjusted from `#B26A00` to exceed 4.5:1) |
| **Status: Danger** | Crimson Red | `#B3261E` | Severe pest incidence, root-zone drought stress, negative margin |
| **Status: Info** | Ocean Blue | `#1565A8` | Advisory telemetry, centroid information |

---

## 2. WCAG 2.1 Contrast Ratio Compliance Table

Computed using the standard relative luminance formula $L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$ with sRGB gamma expansion:

| Text / Foreground | Background Surface | Measured Contrast Ratio | WCAG Target Requirement | Compliance Result |
|---|---|---|---|---|
| Near-Black `#1F2A24` | Warm Off-White `#FFFDF8` | **14.60:1** | Body Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Near-Black `#1F2A24` | Card White `#FFFFFF` | **14.84:1** | Body Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| White `#FFFFFF` | Deep Field Green `#1B5E3B` | **7.75:1** | Button / Header Text ($\ge$ 4.5:1 AA) | **PASS (AAA)** |
| Secondary Text `#4A5750` | Card White `#FFFFFF` | **7.58:1** | Secondary Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Secondary Text `#4A5750` | Warm Off-White `#FFFDF8` | **7.46:1** | Secondary Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Near-Black `#1F2A24` | Amber Accent `#F2B01E` | **7.78:1** | Amber Button / Badge ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| White `#FFFFFF` | Water Blue `#1565A8` | **6.07:1** | Water Button / Badge ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Success `#2E7D32` | Card White `#FFFFFF` | **5.13:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Warning (Adjusted) `#9E5B00` | Card White `#FFFFFF` | **5.32:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Danger `#B3261E` | Card White `#FFFFFF` | **6.54:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Info `#1565A8` | Card White `#FFFFFF` | **6.07:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Soil Brown `#7A553A` | Card White `#FFFFFF` | **6.59:1** | Accent Text / Icons ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Near-Black `#1F2A24` | Success Tint `#E8F5E9` | **13.19:1** | Status Badge Fill ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Near-Black `#1F2A24` | Warning Tint `#FFF8E1` | **13.97:1** | Status Badge Fill ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Near-Black `#1F2A24` | Danger Tint `#FFEBEE` | **12.98:1** | Status Badge Fill ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Near-Black `#1F2A24` | Info Tint `#E3F2FD` | **12.99:1** | Status Badge Fill ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |

---

## 3. Shape & Icon Redundancy (Non-Color Dependency)

Per WCAG 1.4.1 (Use of Color), color is **never the sole indicator** of any system condition:

| Status Condition | Color | Distinct Icon Shape | Visible Text Word |
|---|---|---|---|
| **Optimal / Normal** | Forest Green `#2E7D32` | **Circle with Checkmark** (`CheckCircle2`) | "Adequate" / "Healthy" / "Optimal" |
| **Watch / Moderate** | Deep Gold Ochre `#9E5B00` | **Triangle with Exclamation** (`AlertTriangle`) | "Attention" / "Monitor" / "Approaching" |
| **Critical / Action** | Crimson Red `#B3261E` | **Octagon with Cross** (`AlertOctagon`) | "Urgent" / "Severe" / "Irrigate Now" |
| **Informational** | Ocean Blue `#1565A8` | **Circle with Info** (`Info`) | "Telemetry" / "Open-Meteo" / "Forecast" |

---

## 4. Dark Mode Palette & Contrast Verification (Round 5)

Dark mode adopts deep organic forest slates (`#0D1410` page background, `#18241E` card surfaces, `#273B30` borders) paired with high-luminance readable text and accessible status accents:

| Role | Color Name | Hex Code | Purpose |
|---|---|---|---|
| **Dark Page Background** | Deep Forest Slate | `#0D1410` | Canvas background in dark mode |
| **Dark Card Surface** | Organic Moss Obsidian | `#18241E` | Card and modal container surfaces |
| **Dark Card Border** | Dark Pine Border | `#273B30` | 1px subtle card boundary |
| **Dark Body Text** | Warm Off-White | `#F2F5F3` | Primary reading text in dark mode |
| **Dark Secondary Text** | Pale Sage | `#9EB0A5` | Explanations, subtitles, parameter hints |
| **Dark Amber Accent** | Harvest Gold | `#F2B01E` | Active highlights, buttons, and badges |
| **Dark Status: Success** | Spring Emerald | `#4ADE80` | Healthy crops, optimal soil moisture |
| **Dark Status: Warning** | Amber Ochre | `#FBBF24` | Monitor irrigation threshold, spray delay |
| **Dark Status: Danger** | Vivid Coral Red | `#F87171` | Severe disease infection, root-zone drought |
| **Dark Status: Info** | Sky Blue | `#60A5FA` | Agro-meteorological telemetry |

### Dark Mode Measured Contrast Ratios:

| Text / Element | Background Surface | Measured Contrast Ratio | WCAG Target Requirement | Compliance Result |
|---|---|---|---|---|
| Primary Text `#F2F5F3` | Dark Card Surface `#18241E` | **14.16:1** | Body Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Primary Text `#F2F5F3` | Dark Page Canvas `#0D1410` | **15.22:1** | Body Text ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Secondary Text `#9EB0A5` | Dark Card Surface `#18241E` | **6.74:1** | Secondary Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Amber Accent `#F2B01E` | Dark Card Surface `#18241E` | **8.57:1** | Highlight / Button ($\ge$ 7.0:1 AAA) | **PASS (AAA)** |
| Success Text `#4ADE80` | Dark Card Surface `#18241E` | **8.86:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AAA)** |
| Warning Text `#FBBF24` | Dark Card Surface `#18241E` | **9.29:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AAA)** |
| Danger Text `#F87171` | Dark Card Surface `#18241E` | **5.62:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Info Text `#60A5FA` | Dark Card Surface `#18241E` | **6.08:1** | Status Text ($\ge$ 4.5:1 AA) | **PASS (AA)** |
| Icon Accents | Dark Card Surface `#18241E` | **> 5.5:1** | Graphical Objects ($\ge$ 3.0:1 AA) | **PASS (AA)** |

> [!NOTE]
> In dark mode as well as light mode, color is never the sole indicator of system state. Status badges maintain their distinct geometric shapes (circle-tick, triangle-warning, octagon-cross, circle-clock) alongside visible text labels across all themes.

