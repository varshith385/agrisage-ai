"""
Evaluation script for AgriSage AI Plant Disease Classification Model.
Evaluates local sample benchmark fixtures from PlantVillage against MobileNetV2.

CRITICAL CAVEATS & DISCLOSURES:
- Sample size: n=3 sample images included in repository fixtures.
- Potential training data overlap: These images are from the PlantVillage dataset; because
  the pretrained model neghani/plantvillage-mobilenetv2 was trained on PlantVillage,
  these evaluation samples may overlap with the training distribution, making test accuracy
  highly optimistic compared to in-field operational performance.
- Dataset Source: spMohanty/PlantVillage-Dataset (GitHub / Hugging Face).
- Dataset Licence: 'to verify' (licence details must be verified directly against the upstream repository).
- Statistical validity: Per-class accuracy with ~1 image per class is illustrative only and NOT
  statistically meaningful or indicative of real-world field robustness.
- App UI Policy: Never surface these benchmark numbers in the user-facing UI as 'model accuracy'.
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
    print("1. Sample Size: n = 3 curated benchmark leaf fixtures.")
    print("2. Overlap Notice: Samples originate from PlantVillage. Because the pretrained")
    print("   MobileNetV2 model was trained on PlantVillage, results are optimistic and")
    print("   do NOT represent field performance under variable natural illumination or backgrounds.")
    print("3. Dataset Licence: 'to verify' (upstream PlantVillage terms to verify).")
    print("4. Statistical note: Per-class evaluation with 1 image/class is NOT statistically")
    print("   meaningful for generalisation. Do NOT display these results in the user UI as model accuracy.")
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
