# Grow2Gain — Demonstration Video Screen Recording Script

**Target Duration:** ~3 minutes (180 seconds)  
**Target Audience:** Indian smallholder farmers, agronomists, and hackathon evaluators  
**Tone:** Plain language, practical, clear, honest (no hype, no fabricated claims)  
**Languages for Recording:** English, Telugu, or Hindi (switch audio track or record separate takes)

---

## Scene 1: Introduction & Language Switch (0:00 – 0:25)
* **Visual:** Browser showing `http://localhost:5190/dashboard` on desktop or mobile. The mouse cursor hovers over the top navigation bar.
* **Action:**
  1. Click the Language buttons: toggle from **EN** to **తెలుగు (Telugu)**, then to **हिन्दी (Hindi)**, and back to **EN** (or remain in Telugu).
  2. Point to the **ActiveFarmBanner** displaying "Rameshwaram Holding • 5.0 ac • Geikonda, Warangal".
  3. Show the farm switcher dropdown demonstrating how multi-plot holdings synchronize across the platform.
* **Spoken Script (English):**
  > "Welcome to AgriSage AI, an agronomic decision-support platform designed specifically for Indian farmers. Notice right at the top: you can use the entire system in English, Telugu, or Hindi. The banner shows your active farm holding in Warangal with five acres of mixed land tenure. Everything in AgriSage connects directly to this parcel."
* **Telugu Alternative:**
  > "అగ్రిసేజ్ ఏఐ కి స్వాగతం. ఇక్కడ మీరు తెలుగు, హిందీ లేదా ఇంగ్లీషులో సులభంగా సమాచారం పొందవచ్చు. పైన మీ పొలం వివరాలు కనిపిస్తాయి."

---

## Scene 2: Live Agro-Weather & Rain Skip (0:25 – 0:50)
* **Visual:** Click **Weather & Forecast** (`/setup`) in the sidebar or bottom navigation.
* **Action:**
  1. Point to the temperature, humidity, and rainfall card for Geikonda centroid.
  2. Scroll down to the 7-day Evapotranspiration (ET0) demand forecast.
  3. Point out the honesty badge: "Modelled from Open-Meteo weather models; indicative forecasts".
* **Spoken Script:**
  > "Before planning field work, check the weather. Here we see live temperature, humidity, and expected rainfall for your village. AgriSage also calculates Reference Evapotranspiration, or ET0, based on the United Nations FAO-56 scientific paper. This tells us how much moisture the atmosphere pulls from your crops each day."

---

## Scene 3: FAO-56 Crop Water Budget & Irrigation (0:50 – 1:20)
* **Visual:** Click **Irrigation & Water** (`/irrigation`).
* **Action:**
  1. Click the primary button: **Compute Crop Water Budget**.
  2. Results immediately load showing:
     - Soil Moisture Depletion vs. Readily Available Water (RAW: 123.5 mm).
     - Next Irrigation Date and Gross Litres Needed (~1,133,120 L for 5 acres).
     - "What this means for you" advisory card.
  3. Click the **Listen** (Read-Aloud) button to demonstrate audio advisory in the chosen language.
* **Spoken Script:**
  > "Next, let's open Irrigation. Instead of guessing when to turn on the pump, click 'Compute Crop Water Budget'. The system combines your cotton crop stage, black cotton soil properties, and weather to measure root zone depletion. If depletion exceeds the safe threshold, it alerts you with the exact litres needed. Notice the honesty note: soil moisture is modelled, not measured by physical probes."

---

## Scene 4: Leaf Disease Diagnosis with Image Gate (1:20 – 1:55)
* **Visual:** Click **Disease Diagnosis** (`/disease`).
* **Action:**
  1. Select a sample leaf image (e.g. Cotton Leaf Spot from evaluation samples).
  2. Click **Run Diagnostic Analysis**.
  3. Show the result card:
     - Disease Name & Confidence Rating (e.g., 88% confidence).
     - "What this means for you" plain summary.
     - Biological & Organic IPM remedy vs. Chemical options.
  4. Point out the honest limitation badge if an image has low lighting or poor angle.
* **Spoken Script:**
  > "Under Disease Diagnosis, take a photo of any diseased leaf with your phone. The AI diagnostic model identifies the specific leaf spot or blight and displays an honest confidence rating. Below the diagnosis, you receive both biological organic remedies and standard chemical treatments, plus clear instructions on what to verify in the field."

---

## Scene 5: What-If Profit Simulator & Economics (1:55 – 2:25)
* **Visual:** Click **Economics & Profit** (`/economics`).
* **Action:**
  1. Show the baseline net profit card for Ramesh's 5-acre cotton holding.
  2. Drag the **Harvest Yield** slider from 8 quintals/acre up to 12 quintals/acre.
  3. Drag the **Expected Mandi Price** slider from ₹7,100 to ₹7,800/quintal.
  4. Point to the **Live Net Profit** updating instantly in real-time.
  5. Click **Reset to Baseline** to restore original farm estimates.
* **Spoken Script:**
  > "In the Economics section, farmers can simulate their actual income before the harvest. Use the interactive What-If sliders to adjust your expected yield and market price. Watch how your live net profit immediately updates for both owned and leased acres, factoring in seed, fertilizer, and lease costs."

---

## Scene 6: Voice Assistant in Action (2:25 – 2:45)
* **Visual:** Click the floating **Voice Assistant** button or top bar Voice button.
* **Action:**
  1. Tap the suggestion chip: "Will it rain today?" or speak into the microphone.
  2. Assistant responds with audio playback and opens the corresponding action card.
* **Spoken Script:**
  > "Farmers with low literacy can use the voice assistant. Tap the microphone and speak naturally in Telugu, Hindi, or English. The assistant provides spoken advice and links directly to the right tool."

---

## Scene 7: Pictorial Mode & Conclusion (2:45 – 3:00)
* **Visual:** Click the **Pictorial** button in the top bar.
* **Action:**
  1. Show the entire interface transform into large visual icon tiles with simple text and one-tap audio read-aloud buttons.
  2. Highlight that the full detail view is always just one tap away.
* **Spoken Script:**
  > "Finally, toggle Pictorial Mode for a simplified visual interface with large icon cards and one-tap voice reading. AgriSage AI combines scientific agronomy with accessible design so every farmer can make informed decisions. Thank you."
