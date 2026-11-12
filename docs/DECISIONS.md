# AgriSage AI — Architectural Decision Record (`docs/DECISIONS.md`)

**Yuktik 2026 Hackathon | Technical Decisions & Rationale**

In accordance with the **Decision Rule**, reasonable technical choices are made autonomously and recorded below with concise justifications.

---

| ID | Title / Area | Decision Summary | Rationale / Trade-offs |
|---|---|---|---|
| **ADR-01** | Python Runtime Environment | Create backend virtualenv strictly using `py -3.12 -m venv .venv`. | Default Python on the host is 3.14, which lacks pre-compiled wheels for essential ML/CV libraries (e.g. PyTorch, torchvision, C-extensions). |
| **ADR-02** | Database Engine | Use SQLite managed via SQLAlchemy 2.0 ORM. | Self-contained, zero external daemon setup, fully portable on Windows, fast for testing, and sufficient for hackathon multi-user evaluation. |
| **ADR-03** | Evapotranspiration Model | Use FAO-56 Single Crop Coefficient ($ET_c = K_c \times ET_0$) rather than dual $K_c$. | Scientifically robust, well-documented FAO baseline that requires only reference $ET_0$ and growth stage $K_c$, avoiding spurious soil evaporation parameters without field sensors. |
| **ADR-04** | Plant Disease CV Model | Deploy a pretrained PlantVillage classification model for CPU inference with an input quality gate. | Free public model running fast on CPU; coupled with mandatory lab-image disclaimers and low-confidence "uncertain" fallbacks. |
| **ADR-05** | Pluggable Soil Health Card OCR | Pluggable OCR interface (EasyOCR, Tesseract, or Vision LLM) with a mandatory human confirmation UI. | Tesseract requires a native Windows install which may be absent; values are confirmed by the farmer before saving, preventing silent OCR error propagation. |
| **ADR-06** | Spatial Privacy & Outbreak Mapping | Restrict location telemetry to village centroids; enforce minimum 3-report cluster threshold on Outbreak Map. | Prevents exposure of exact farm boundaries and contact data to non-consenting users while preserving regional epidemiological awareness. |
| **ADR-07** | Global Multilingual Voice Assistant | Implement Voice Assistant as a global floating component on every page with browser Web Speech API and typed chat fallback. | Empowers non-literate and regional language farmers (`te`, `hi`, `en`) across any view without requiring expensive cloud speech API keys; degrades cleanly if mic is blocked. |
| **ADR-08** | Universal Explainability Schema | Mandate `{value, confidence, reasons[], sources[], status, limitations[]}` on all advisory payloads. | Eliminates black-box AI outputs and enforces hackathon honesty by presenting traceable scientific or meteorological reasoning on every recommendation. |
| **ADR-09** | Financial Precision | Enforce Python `Decimal` for all cost-of-cultivation, revenue, profit, and break-even calculations. | Eliminates binary floating-point rounding anomalies in agricultural accounting, especially when dividing acres and quintals. |
| **ADR-10** | Scope Guard Enforcement | Enforce strict Tier 1 completion prior to beginning Tier 2, and Tier 2 before Tier 3. | Prevents spreading effort across unfinished surfaces; ensures the core vertical slice and demo story are production-grade first. |
| **ADR-11** | Direct `bcrypt` Hashing | Use the `bcrypt` package directly without `passlib`. | Eliminates passlib's legacy bcrypt backend incompatibilities and ensures clean salt generation and verification under Python 3.12. |
| **ADR-12** | Demo Mode Security Boundary | Restrict passwordless `/api/v1/auth/demo-login` exclusively to Farmer Ramesh when `DEMO_MODE=true`. | Prevents privilege escalation; Admin, Expert, and Buyer accounts must authenticate via explicit credentials seeded in `.env.example`. |
| **ADR-13** | Absolute SQLite Path & Secret Guard | Resolve `SQLITE_DB_PATH` to an absolute path and enforce startup abortion if placeholder JWT secret is used when `DEBUG=false`. | Guarantees database file location remains stable regardless of process working directory and prevents insecure production deployments. |
| **ADR-14** | JWT Client Storage Strategy | Store JWT token and current session in browser `localStorage` (`agrisage_token`). | Provides seamless persistence across SPA page reloads and mobile browser tab refreshes for farmers with intermittent connectivity. Automatically cleared on 401 response and on user logout; avoids complex cross-origin cookie setup for local hackathon demo. |

