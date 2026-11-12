# Environment Check Results

**Date / Timestamp:** 2026-11-13 (Local Time: 00:45:00+05:30)

---

## 1. Tool Versions Check

| Tool / Command | Result / Version | Status |
|---|---|---|
| `python --version` | `Python 3.14.3` | Installed |
| `node --version` | `v26.13.0` | Installed |
| `npm --version` | `11.20.0` | Installed |
| `git --version` | `git version 2.53.0.windows.1` | Installed |
| `tesseract --version` | `CommandNotFoundException` (Not recognized / not in PATH) | **Missing** |

---

## 2. Internet Connectivity Check

- **Target Endpoint:** `https://api.open-meteo.com/v1/forecast?latitude=17.38&longitude=78.48&current=temperature_2m`
- **Connection Status:** **Connected (HTTP 200 / Successful Response)**
- **Sample Payload Received:**
  ```json
  {
    "latitude": 17.398945,
    "longitude": 78.457085,
    "generationtime_ms": 0.012,
    "utc_offset_seconds": 0,
    "timezone": "GMT",
    "timezone_abbreviation": "GMT",
    "elevation": 498.0,
    "current_units": {
      "time": "iso8601",
      "interval": "seconds",
      "temperature_2m": "°C"
    },
    "current": {
      "time": "2026-11-12T19:15",
      "interval": 900,
      "temperature_2m": 22.4
    }
  }
  ```

---

## 3. Required / Recommended Installations

### 1. Tesseract OCR (Optional / Recommended for Local OCR)
- **Status:** Not currently installed or not present in system PATH.
- **Purpose:** Used for local optical character recognition (e.g., Soil Health Card parsing).
- **How to Install (Windows):**
  - Via Windows Package Manager (winget):
    ```powershell
    winget install UB-Mannheim.TesseractOCR
    ```
  - Or download the installer directly: [UB-Mannheim Tesseract OCR for Windows](https://github.com/UB-Mannheim/tesseract/wiki).
  - Add the installation path (typically `C:\Program Files\Tesseract-OCR`) to your system `PATH` environment variable.
  - *Note:* If you plan to use a Vision LLM API (e.g., Gemini Vision) or EasyOCR for Soil Health Card extraction, local Tesseract binary is optional.

### 2. Python Version Note (Advisory)
- **Current Version:** Python 3.14.3
- **Advisory:** Python 3.14 is a bleeding-edge release. Major machine learning packages (such as PyTorch, torchvision, or certain native binary wheels) may lack pre-built wheels for Python 3.14 on Windows. If wheel build failures occur during ML package installation, consider installing Python 3.11 or 3.12:
  ```powershell
  winget install Python.Python.3.11
  # or
  winget install Python.Python.3.12
  ```

