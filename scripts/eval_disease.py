"""
Evaluation script for AgriSage AI Plant Disease Classification Model.
Evaluates local sample benchmark fixtures from PlantVillage against MobileNetV2.

CRITICAL CAVEATS & DISCLOSURES:
- The evaluation sample is small (exact sample size n = 3).
- PlantVillage images may overlap with the model's training data (so results are optimistic).
- The results are not a measure of real-world field accuracy.
- The dataset licence is 'to verify' unless you open the licence page.
- Per-class accuracy with ~1 image per class is not statistically meaningful: say so.
- No accuracy number is shown in the app UI as the model's accuracy.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.ml.disease_model import DiseaseClassificationModel


def run_evaluation():
    fixtures_dir = PROJECT_ROOT / "backend" / "tests" / "fixtures"
    if not fixtures_dir.exists():
        print(f"Fixtures directory not found at {fixtures_dir}")
        return

    test_samples = [
        {
            "filename": "tomato_early_blight.jpg",
            "expected_class": "Tomato___Early_blight",
            "crop": "Tomato",
        },
        {
            "filename": "apple_black_rot.jpg",
            "expected_class": "Apple___Black_rot",
            "crop": "Apple",
        },
        {
            "filename": "corn_common_rust.jpg",
            "expected_class": "Corn_(maize)___Common_rust_",
            "crop": "Corn (Maize)",
        },
    ]

    model = DiseaseClassificationModel.get_instance()
    model.load_model()

    print("=" * 80)
    print("AGRISAGE AI: PLANT DISEASE MODEL BENCHMARK EVALUATION")
    print("=" * 80)
    print("DISCLAIMERS & METHODOLOGY:")
    print("1. The evaluation sample is small (exact sample size n = 3).")
    print("2. PlantVillage images may overlap with the model's training data (so results are optimistic).")
    print("3. The results are not a measure of real-world field accuracy.")
    print("4. The dataset licence is 'to verify' unless you open the licence page.")
    print("5. No accuracy number is shown in the app UI as the model's accuracy.")
    print("=" * 80)

    top1_correct = 0
    top3_correct = 0
    total = len(test_samples)

    for sample in test_samples:
        file_path = fixtures_dir / sample["filename"]
        if not file_path.exists():
            print(f"File missing: {file_path}")
            continue

        with open(file_path, "rb") as f:
            img_bytes = f.read()

        result = model._sync_predict(img_bytes, crop_hint=sample["crop"])
        qg = result.get("quality_gate", {})
        top3 = result.get("top3_predictions", [])
        top1 = top3[0] if top3 else {}

        is_top1 = top1.get("class_key") == sample["expected_class"]
        is_top3 = any(p.get("class_key") == sample["expected_class"] for p in top3)

        if is_top1:
            top1_correct += 1
        if is_top3:
            top3_correct += 1

        print(f"\n[SAMPLE] {sample['filename']}")
        print(f"  - Expected Class: {sample['expected_class']}")
        print(f"  - Quality Gate: {'PASSED' if qg.get('passed') else 'FAILED'} (Sharpness: {qg.get('metrics', {}).get('sharpness_laplacian_var')}, Foliar: {qg.get('metrics', {}).get('foliar_ratio')})")
        print(f"  - Top-1 Predicted: {top1.get('class_key')} ({top1.get('probability', 0.0):.2%}) -> {'CORRECT' if is_top1 else 'INCORRECT'}")
        print("  - Top-3 Ranking:")
        for idx, cand in enumerate(top3, 1):
            print(f"      {idx}. {cand['class_key']}: {cand['probability']:.2%}")

    print("\n" + "=" * 80)
    print("SUMMARY RESULTS (Indicative on n=3 benchmark samples only):")
    print(f"  Total Evaluated: {total}")
    print(f"  Top-1 Accuracy: {top1_correct}/{total} ({top1_correct / total:.1%})")
    print(f"  Top-3 Accuracy: {top3_correct}/{total} ({top3_correct / total:.1%})")
    print("=" * 80)


if __name__ == "__main__":
    run_evaluation()
