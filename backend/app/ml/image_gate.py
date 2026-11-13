import io
import logging
from typing import Any, Dict, List, Literal, Optional, Tuple

import numpy as np
from PIL import Image
from fastapi import HTTPException, status

from backend.app.config import settings

logger = logging.getLogger(__name__)

# Translated rejection messages per specification
REJECTION_MESSAGES: Dict[str, str] = {
    "en": "This doesn't look like a farm or crop photo. Please upload a clear picture of your field, soil or crop.",
    "te": "ఇది పొలం లేదా పంట ఫోటోలా లేదు. దయచేసి మీ పొలం, నేల లేదా పంట యొక్క స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.",
    "hi": "यह किसी खेत या फसल का फोटो नहीं लग रहा है। कृपया अपने खेत, मिट्टी या फसल की एक साफ तस्वीर अपलोड करें।",
}

BORDERLINE_MESSAGES: Dict[str, str] = {
    "en": "This photo has borderline farm or crop confidence. Please confirm to proceed or upload a clearer picture of your field, soil or crop.",
    "te": "ఈ ఫోటోలో పొలం లేదా పంట స్పష్టత తక్కువగా ఉంది. ముందుకు సాగడానికి నిర్ధారించండి లేదా స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.",
    "hi": "इस तस्वीर में खेत या फसल की स्पष्टता कम है। आगे बढ़ने के लिए पुष्टि करें या अधिक स्पष्ट तस्वीर अपलोड करें।",
}

# Zero-shot CLIP label sets for domain verification
LABELS_LEAF: List[str] = [
    "a close-up photo of a plant leaf or foliage",
    "a photo of a crop leaf with plant disease",
    "a photo of healthy agricultural crop leaves",
    "a photo of farm plant leaves",
    "a screenshot of computer code, programming code, or terminal",
    "a document with printed text, paperwork, receipt, or invoice",
    "a portrait photo of a person or human face",
    "an indoor room, furniture, or office interior",
    "a photo of a car or vehicle",
    "a cartoon, comic, or digital graphic illustration",
]

LABELS_IRRIGATION: List[str] = [
    "a photo of an agricultural field, farm dirt, or soil",
    "a photo of farm crops and soil in a field",
    "a photo of irrigation water, mud, or moisture in a field",
    "a photo of farm crop plants growing outdoors",
    "a screenshot of computer code, programming code, or terminal",
    "a document with printed text, paperwork, receipt, or invoice",
    "a portrait photo of a person or human face",
    "an indoor room, furniture, or office interior",
    "a photo of a car or vehicle",
    "a cartoon, comic, or digital graphic illustration",
]

POS_COUNT_LEAF = 4
POS_COUNT_IRRIGATION = 4


class ImageDomainGate:
    """
    Authoritative backend image gate for agricultural uploads (Disease and Irrigation).
    Applies two sequential verification tiers:
      Tier 1: Fast, deterministic colour variety and foliar/soil pixel share heuristics.
      Tier 2: Zero-shot CLIP check (openai/clip-vit-base-patch32, CPU) with domain-specific label sets.
    """

    def __init__(self):
        self._clip_processor = None
        self._clip_model = None
        self._clip_load_failed = False
        self._clip_initialized = False

    def _ensure_clip_loaded(self) -> bool:
        if not settings.IMAGE_GATE_USE_CLIP or self._clip_load_failed:
            return False
        if self._clip_initialized:
            return self._clip_model is not None

        try:
            from transformers import CLIPModel, CLIPProcessor

            logger.info("Initializing zero-shot CLIP image gate on CPU...")
            self._clip_processor = CLIPProcessor.from_pretrained(
                "openai/clip-vit-base-patch32",
                local_files_only=False,
            )
            self._clip_model = CLIPModel.from_pretrained(
                "openai/clip-vit-base-patch32",
                local_files_only=False,
            )
            self._clip_model.eval()
            self._clip_initialized = True
            logger.info("CLIP zero-shot domain gate initialized successfully.")
            return True
        except Exception as exc:
            logger.warning(
                f"Could not initialize CLIP zero-shot gate ({exc}). "
                "Falling back to heuristic colour variety and foliar/soil chromaticity gate."
            )
            self._clip_load_failed = True
            self._clip_initialized = True
            return False

    @staticmethod
    def evaluate_heuristics(image: Image.Image) -> Dict[str, Any]:
        """
        Stage 1 cheap heuristics:
        1. Low colour variety: measures standard deviation across color channel differentials.
        2. Agricultural pixel share: measures green (vegetation), brown/mud (soil), or water reflection.
        """
        w, h = image.size
        if w < 32 or h < 32:
            return {
                "passed": False,
                "reason": f"Image dimensions too small ({w}x{h} px).",
                "agri_share": 0.0,
                "color_variety": 0.0,
            }

        small = image.resize((128, 128)).convert("RGB")
        arr = np.array(small, dtype=np.float32)

        r = arr[:, :, 0]
        g = arr[:, :, 1]
        b = arr[:, :, 2]

        # Colour variety across channels: documents/terminals have near-zero (r-g) and (g-b) variation
        rg_diff = r - g
        gb_diff = g - b
        color_variety = float(np.std(rg_diff) + np.std(gb_diff))

        # Agricultural chromaticity signals
        # 1. Green vegetative canopy:
        green_mask = (g > 1.05 * r) & (g > 1.05 * b) & (g > 35)
        # 2. Brown soil / dry earth:
        brown_mask = (r > g) & (g > b) & (r > 40) & (r - b > 15)
        # 3. Wet soil / dark mud:
        mud_mask = (
            (r < 95)
            & (g < 95)
            & (b < 95)
            & (np.abs(r - g) < 20)
            & (np.abs(g - b) < 20)
            & (r > 15)
        )
        # 4. Field surface water / reflective puddle:
        water_mask = (b >= r) & (b >= g) & (b > 50) & (r < 185)

        agri_pixels = green_mask | brown_mask | mud_mask | water_mask
        agri_share = float(np.mean(agri_pixels))

        mean_lum = float(np.mean(0.299 * r + 0.587 * g + 0.114 * b))

        # Deterministic rejection for pure non-farm synthetic / document patterns
        # Flat/monochrome documents, pure terminal code, or blue screens
        if color_variety < 4.0 and agri_share < 0.05 and mean_lum >= settings.QUALITY_GATE_MIN_LUMINANCE:
            return {
                "passed": False,
                "reason": (
                    f"Low colour variety ({color_variety:.1f}) and negligible agricultural pixel share ({agri_share:.1%})."
                ),
                "agri_share": round(agri_share, 4),
                "color_variety": round(color_variety, 2),
            }

        return {
            "passed": True,
            "reason": "Heuristic gate passed.",
            "agri_share": round(agri_share, 4),
            "color_variety": round(color_variety, 2),
        }

    def evaluate_clip(
        self,
        image: Image.Image,
        domain: Literal["leaf", "irrigation"],
    ) -> Tuple[float, str]:
        """
        Stage 2: CLIP zero-shot evaluation on CPU.
        Returns:
            (positive_probability, top_detected_class)
        """
        import torch

        labels = LABELS_LEAF if domain == "leaf" else LABELS_IRRIGATION
        pos_count = POS_COUNT_LEAF if domain == "leaf" else POS_COUNT_IRRIGATION

        inputs = self._clip_processor(
            text=labels,
            images=image,
            return_tensors="pt",
            padding=True,
        )

        with torch.no_grad():
            outputs = self._clip_model(**inputs)
            logits = outputs.logits_per_image
            probs = logits.softmax(dim=1).squeeze().tolist()

        if isinstance(probs, float):
            probs = [probs]

        positive_prob = sum(probs[:pos_count])
        top_idx = int(np.argmax(probs))
        top_class = labels[top_idx]

        return float(positive_prob), top_class

    def verify_image(
        self,
        image_bytes: bytes,
        domain: Literal["leaf", "irrigation"] = "leaf",
        language: str = "en",
        confirmed: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes full authoritative gate:
        1. Decode image via Pillow with decompression bomb guard
        2. Heuristic check (colour variety + agricultural pixel share)
        3. CLIP zero-shot check
        4. Rejection or confirmation enforcement via HTTP 422
        """
        lang = language if language in REJECTION_MESSAGES else "en"

        # 1. Decode image
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
            image_rgb = image.convert("RGB")
        except Image.DecompressionBombError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Image rejected: Exceeds safe pixel decompression limit (possible decompression bomb).",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid or corrupt image file: {str(exc)}",
            )

        # 2. Stage 1 Heuristics
        heuristic_res = self.evaluate_heuristics(image_rgb)
        if not heuristic_res["passed"]:
            logger.info(f"Image rejected by heuristic gate: {heuristic_res['reason']}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=REJECTION_MESSAGES[lang],
            )

        # 3. Stage 2 CLIP Check (or heuristic fallback)
        clip_available = self._ensure_clip_loaded()
        if clip_available:
            try:
                pos_score, top_label = self.evaluate_clip(image_rgb, domain)
                logger.info(
                    f"CLIP domain check [{domain}]: positive_score={pos_score:.4f}, top_label='{top_label}'"
                )

                # Outright rejection below borderline threshold
                if pos_score < settings.IMAGE_GATE_BORDERLINE_THRESHOLD:
                    logger.info(
                        f"Image rejected by CLIP domain gate: pos_score={pos_score:.4f} < {settings.IMAGE_GATE_BORDERLINE_THRESHOLD}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=REJECTION_MESSAGES[lang],
                    )

                # Borderline check [borderline, threshold)
                if pos_score < settings.IMAGE_GATE_THRESHOLD:
                    if not confirmed:
                        logger.info(
                            f"Image borderline: pos_score={pos_score:.4f} in [{settings.IMAGE_GATE_BORDERLINE_THRESHOLD}, {settings.IMAGE_GATE_THRESHOLD}). Awaiting confirmation."
                        )
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail={
                                "message": BORDERLINE_MESSAGES[lang],
                                "borderline": True,
                                "confidence": round(pos_score, 3),
                                "top_class": top_label,
                            },
                        )
                    # User explicitly confirmed
                    return {
                        "passed": True,
                        "mode": "clip",
                        "confidence": round(pos_score, 3),
                        "top_class": top_label,
                        "borderline_confirmed": True,
                        "warning": "Visual indication only; borderline agricultural confidence confirmed by user.",
                    }

                # Clear pass
                return {
                    "passed": True,
                    "mode": "clip",
                    "confidence": round(pos_score, 3),
                    "top_class": top_label,
                    "borderline_confirmed": False,
                }
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"CLIP inference failed ({e}); falling back to heuristic evaluation.")

        # Heuristic fallback (when CLIP is unavailable or disabled)
        agri_share = heuristic_res["agri_share"]
        color_variety = heuristic_res["color_variety"]
        # Heuristic acceptance requires minimum 10% agricultural color pixels and adequate variety
        if agri_share < 0.10 or color_variety < 8.0:
            logger.info(
                f"Image rejected by heuristic fallback: agri_share={agri_share:.3f}, color_variety={color_variety:.1f}"
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=REJECTION_MESSAGES[lang],
            )

        return {
            "passed": True,
            "mode": "heuristic_fallback",
            "confidence": round(min(1.0, agri_share * 2.0), 3),
            "agri_share": agri_share,
            "borderline_confirmed": False,
        }


# Global singleton gate instance
image_domain_gate = ImageDomainGate()
