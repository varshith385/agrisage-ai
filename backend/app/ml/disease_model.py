import asyncio
import io
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
import torch
from transformers import AutoModelForImageClassification

from backend.app.config import settings

logger = logging.getLogger(__name__)

# Enforce decompression bomb safeguard
Image.MAX_IMAGE_PIXELS = settings.MAX_IMAGE_PIXELS

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MODEL_DIR = PROJECT_ROOT / "model_artifacts" / "disease"
KB_FILE = Path(__file__).resolve().parent / "disease_kb.json"

SUPPORTED_CROPS = [
    "Apple",
    "Blueberry",
    "Cherry",
    "Corn (Maize)",
    "Grape",
    "Orange (Citrus)",
    "Peach",
    "Bell Pepper",
    "Potato",
    "Raspberry",
    "Soybean",
    "Squash",
    "Strawberry",
    "Tomato",
]

# Normalization mapping for crop hints (e.g. maize -> Corn (Maize), pepper -> Bell Pepper)
CROP_ALIAS_MAP = {
    "apple": "Apple",
    "blueberry": "Blueberry",
    "cherry": "Cherry",
    "corn": "Corn (Maize)",
    "maize": "Corn (Maize)",
    "grape": "Grape",
    "grapes": "Grape",
    "orange": "Orange (Citrus)",
    "citrus": "Orange (Citrus)",
    "peach": "Peach",
    "pepper": "Bell Pepper",
    "bell pepper": "Bell Pepper",
    "capsicum": "Bell Pepper",
    "potato": "Potato",
    "raspberry": "Raspberry",
    "soybean": "Soybean",
    "soya": "Soybean",
    "squash": "Squash",
    "strawberry": "Strawberry",
    "tomato": "Tomato",
}


class QualityGateResult:
    def __init__(self, passed: bool, reason: str, metrics: Dict[str, float]):
        self.passed = passed
        self.reason = reason
        self.metrics = metrics

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "reason": self.reason,
            "metrics": self.metrics,
        }


class DiseaseClassificationModel:
    _instance: Optional["DiseaseClassificationModel"] = None

    def __init__(self):
        self.model = None
        self.id2label: Dict[int, str] = {}
        self.kb_data: Dict[str, Any] = {}
        self._is_loaded = False
        self._load_kb()

    @classmethod
    def get_instance(cls) -> "DiseaseClassificationModel":
        if cls._instance is None:
            cls._instance = DiseaseClassificationModel()
        return cls._instance

    def _load_kb(self) -> None:
        if KB_FILE.exists():
            try:
                with open(KB_FILE, "r", encoding="utf-8") as f:
                    self.kb_data = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load disease KB: {e}")
                self.kb_data = {}

    def load_model(self) -> None:
        if self._is_loaded and self.model is not None:
            return

        if not MODEL_DIR.exists() or not (MODEL_DIR / "model.safetensors").exists():
            raise FileNotFoundError(
                f"Model weights not found at {MODEL_DIR}. Please run 'python scripts/download_models.py'."
            )

        logger.info(f"Loading pretrained disease model from {MODEL_DIR}...")
        self.model = AutoModelForImageClassification.from_pretrained(str(MODEL_DIR))
        self.model.eval()

        # Build integer-keyed id2label dictionary
        self.id2label = {int(k): v for k, v in self.model.config.id2label.items()}
        self._is_loaded = True
        logger.info(f"Pretrained disease model loaded successfully with {len(self.id2label)} classes.")

    def evaluate_quality_gate(self, image: Image.Image) -> QualityGateResult:
        """
        Evaluate input image quality before sending to CV classifier:
        - Image size >= 64x64
        - Illumination check: average luminance between 20.0 and 240.0
        - Sharpness check: Laplacian variance >= 60.0 on 224x224 resize
        - Foliar/vegetative chromaticity check: allows healthy and diseased leaves
        """
        w, h = image.size
        if w < 64 or h < 64:
            return QualityGateResult(
                passed=False,
                reason=f"Image resolution too low ({w}x{h} px). Minimum required is 64x64 px.",
                metrics={"width": w, "height": h},
            )

        # Normalize to 224x224 for consistent spatial and edge variance scale
        resized = image.resize((224, 224)).convert("RGB")
        arr = np.array(resized, dtype=np.float32)

        # Luminance
        gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
        mean_lum = float(np.mean(gray))

        if mean_lum < settings.QUALITY_GATE_MIN_LUMINANCE:
            return QualityGateResult(
                passed=False,
                reason=(
                    f"Image is too dark to discern foliar lesion patterns (mean luminance: {mean_lum:.1f}, "
                    f"heuristic threshold: {settings.QUALITY_GATE_MIN_LUMINANCE}). Please capture with adequate natural light."
                ),
                metrics={"mean_luminance": mean_lum},
            )

        if mean_lum > settings.QUALITY_GATE_MAX_LUMINANCE:
            return QualityGateResult(
                passed=False,
                reason=(
                    f"Image is overexposed with severe glare or washout (mean luminance: {mean_lum:.1f}, "
                    f"heuristic threshold: {settings.QUALITY_GATE_MAX_LUMINANCE}). Please avoid direct harsh glare."
                ),
                metrics={"mean_luminance": mean_lum},
            )

        # Laplacian sharpness filter on 224x224
        lap = (
            gray[:-2, 1:-1]
            + gray[2:, 1:-1]
            + gray[1:-1, :-2]
            + gray[1:-1, 2:]
            - 4 * gray[1:-1, 1:-1]
        )
        lap_var = float(np.var(lap))

        if lap_var < settings.QUALITY_GATE_MIN_LAPLACIAN_VAR:
            return QualityGateResult(
                passed=False,
                reason=(
                    f"Image is blurry or out of focus (sharpness score: {lap_var:.1f}, "
                    f"heuristic threshold: {settings.QUALITY_GATE_MIN_LAPLACIAN_VAR}). Please hold the camera steady."
                ),
                metrics={"sharpness_laplacian_var": lap_var},
            )

        # Foliar / vegetative / diseased chromaticity heuristic:
        # Green leaves, yellow chlorosis, brown lesions, necrotic spots have (R + G) > 1.2 * B
        foliar_mask = (arr[:, :, 0] + arr[:, :, 1]) > 1.2 * arr[:, :, 2]
        foliar_ratio = float(np.mean(foliar_mask))

        if foliar_ratio < settings.QUALITY_GATE_MIN_FOLIAR_RATIO:
            return QualityGateResult(
                passed=False,
                reason=(
                    f"Image does not appear to contain plant leaves or vegetation (foliar chromaticity: {foliar_ratio:.2f}, "
                    f"heuristic threshold: {settings.QUALITY_GATE_MIN_FOLIAR_RATIO}). Please upload a clear photo of an affected leaf."
                ),
                metrics={"foliar_ratio": foliar_ratio},
            )

        return QualityGateResult(
            passed=True,
            reason="Quality gate passed: illumination, focus, and foliar chromaticity validated.",
            metrics={
                "mean_luminance": round(mean_lum, 1),
                "sharpness_laplacian_var": round(lap_var, 1),
                "foliar_ratio": round(foliar_ratio, 2),
            },
        )

    def _sync_predict(
        self,
        image_bytes: bytes,
        crop_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synchronous model inference executed inside a worker thread.
        Decodes via Pillow, evaluates quality gate, executes MobileNetV2,
        and applies calibrated honesty checks and crop compatibility warnings.
        """
        # 1. Decode image via Pillow with decompression bomb guard
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
            image_rgb = image.convert("RGB")
        except Image.DecompressionBombError:
            return {
                "success": False,
                "error": "Image rejected: Exceeds safe pixel decompression limit (possible decompression bomb).",
                "quality_gate": {"passed": False, "reason": "Decompression bomb limit exceeded", "metrics": {}},
            }
        except Exception as exc:
            return {
                "success": False,
                "error": f"Invalid or corrupt image file: {str(exc)}",
                "quality_gate": {"passed": False, "reason": "Corrupt image format", "metrics": {}},
            }

        # 2. Quality Gate
        q_result = self.evaluate_quality_gate(image_rgb)
        if not q_result.passed:
            return {
                "success": False,
                "error": f"Image quality gate check rejected: {q_result.reason}",
                "quality_gate": q_result.to_dict(),
            }

        # 3. Model Inference
        self.load_model()
        resized = image_rgb.resize((224, 224))
        arr = np.array(resized, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        arr = (arr - mean) / std
        tensor = torch.tensor(arr.transpose(2, 0, 1), dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            logits = self.model(tensor).logits
            probs = torch.softmax(logits, dim=-1)[0]
            top3_probs, top3_indices = torch.topk(probs, 3)

        top3_list = []
        for p, idx in zip(top3_probs, top3_indices):
            class_key = self.id2label[int(idx.item())]
            kb_entry = self.kb_data.get(class_key, {})
            crop_name = kb_entry.get("crop", class_key.split("___")[0].replace("_", " "))
            disease_name = kb_entry.get("disease_name", class_key.split("___")[-1].replace("_", " "))
            top3_list.append(
                {
                    "class_key": class_key,
                    "crop": crop_name,
                    "disease_name": disease_name,
                    "probability": round(float(p.item()), 4),
                }
            )

        top1 = top3_list[0]
        confidence = top1["probability"]
        predicted_class = top1["class_key"]
        predicted_crop = top1["crop"]
        predicted_disease = top1["disease_name"]

        # 4. Warnings and Calibrated Honesty Checks
        warnings: List[str] = []
        warnings.append(
            "Model disclaimer: Trained on lab-conditioned PlantVillage benchmark imagery; accuracy may be reduced on complex field backgrounds or mixed illumination."
        )

        # Check crop hint compatibility
        crop_supported = True
        normalized_hint = None
        if crop_hint and crop_hint.strip():
            hint_clean = crop_hint.strip().lower()
            normalized_hint = CROP_ALIAS_MAP.get(hint_clean)

            if normalized_hint is None:
                crop_supported = False
                supported_str = ", ".join(SUPPORTED_CROPS)
                warnings.append(
                    f"Crop '{crop_hint}' is not supported by the PlantVillage benchmark classification model "
                    f"(supported crops: {supported_str}). The predicted label represents a visual similarity match "
                    f"on benchmark foliar lesions and must not be treated as a definitive diagnosis for '{crop_hint}'."
                )
            elif normalized_hint.lower() != predicted_crop.lower():
                warnings.append(
                    f"Possible crop mismatch: user indicated '{crop_hint}', but the vision model identified symptoms matching '{predicted_crop}'. "
                    f"Please verify the specimen leaf or select the appropriate crop."
                )

        # Low confidence uncertainty check
        is_uncertain = confidence < settings.DISEASE_CONFIDENCE_THRESHOLD
        if is_uncertain:
            warnings.append(
                f"Low prediction confidence ({confidence:.1%} < {settings.DISEASE_CONFIDENCE_THRESHOLD:.1%}). "
                "Diagnosis is inconclusive. Please consult your local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer "
                "for ground physical verification before applying any treatment."
            )

        # Fetch KB details
        kb_entry = self.kb_data.get(predicted_class, {})
        symptoms = kb_entry.get("symptoms", "Symptoms documentation not available.")
        safe_ipm_steps = kb_entry.get("cultural_organic_control", [])
        sources = kb_entry.get("sources", [])
        scheme_tags = kb_entry.get("scheme_tags", ["Check local agricultural department for eligibility (to verify)"])

        return {
            "success": True,
            "quality_gate": q_result.to_dict(),
            "predicted_class": predicted_class,
            "predicted_crop": predicted_crop,
            "predicted_disease": predicted_disease,
            "prediction_confidence": confidence,  # explicitly uncalibrated
            "confidence_type": "prediction confidence (uncalibrated)",
            "is_uncertain": is_uncertain,
            "crop_supported": crop_supported,
            "supported_crops": SUPPORTED_CROPS,
            "top3_predictions": top3_list,
            "symptoms": symptoms,
            "safe_ipm_steps": safe_ipm_steps,
            "sources": sources,
            "scheme_tags": scheme_tags,
            "warnings": warnings,
        }

    async def predict_async(
        self,
        image_bytes: bytes,
        crop_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Non-blocking asynchronous prediction executed in a worker thread."""
        return await asyncio.to_thread(self._sync_predict, image_bytes, crop_hint)


# Global singleton helper
disease_model = DiseaseClassificationModel.get_instance()
