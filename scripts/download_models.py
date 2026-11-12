import hashlib
import json
import os
import sys
import urllib.request

MODEL_ID = "neghani/plantvillage-mobilenetv2"
REVISION = "d33601185b32cf05b3942661b8d84ffb86dc48ec"
BASE_HF_URL = f"https://huggingface.co/{MODEL_ID}/resolve/{REVISION}"

FILES_TO_DOWNLOAD = {
    "model.safetensors": f"{BASE_HF_URL}/model.safetensors",
    "config.json": f"{BASE_HF_URL}/config.json",
}

TEST_FIXTURE_URLS = {
    "tomato_early_blight.jpg": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B%208389.JPG",
    "tomato_healthy.jpg": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___healthy/000bf685-b305-408b-91f4-3047f4e0e481___GH_HL%20Leaf%209080.JPG",
    "potato_late_blight.jpg": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___Late_blight/006953f5-4f41-4140-9423-8d3e1676d294___RS_LB%204936.JPG",
}

EVAL_SAMPLE_URLS = [
    ("Tomato___Early_blight", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B%208389.JPG"),
    ("Tomato___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___healthy/000bf685-b305-408b-91f4-3047f4e0e481___GH_HL%20Leaf%209080.JPG"),
    ("Potato___Early_blight", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___Early_blight/03b563da-22d7-4781-b359-15ab4238b071___RS_Erly.B%206778.JPG"),
    ("Potato___Late_blight", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___Late_blight/006953f5-4f41-4140-9423-8d3e1676d294___RS_LB%204936.JPG"),
    ("Potato___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___healthy/00fc8ee8-bb2c-449e-b120-80dd5262c4b8___RS_HL%201864.JPG"),
    ("Apple___Apple_scab", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Apple___Apple_scab/0007588c-c397-4f96-a01e-6276802e269f___FREC_Scab%203335.JPG"),
    ("Apple___Black_rot", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Apple___Black_rot/00e909aa-e3ae-4558-9961-336bb0f35db3___JR_FrgE.S%208593.JPG"),
    ("Apple___Cedar_apple_rust", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Apple___Cedar_apple_rust/025b2b2c-2792-4809-bc34-7546e9f877bf___FREC_C.Rust%203655.JPG"),
    ("Apple___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Apple___healthy/0055dd26-24a7-4f05-ba79-c43d3717ea66___RS_HL%205672.JPG"),
    ("Corn_(maize)___Common_rust_", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Corn_(maize)___Common_rust_/RS_Rust%201564.JPG"),
    ("Corn_(maize)___Northern_Leaf_Blight", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Corn_(maize)___Northern_Leaf_Blight/RS_NLB%203598.JPG"),
    ("Corn_(maize)___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Corn_(maize)___healthy/R.S_HL%208226.JPG"),
    ("Grape___Black_rot", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Grape___Black_rot/00e527fc-7186-4444-933e-10ea3579b291___FAM_B.Rot%203204.JPG"),
    ("Grape___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Grape___healthy/00a72661-8946-4cc2-9842-8c10e6a17b2b___Mt.N.V_HL%206121.JPG"),
    ("Peach___Bacterial_spot", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Peach___Bacterial_spot/002e7df8-ea7e-4043-b960-98547eb5bfab___Rutg._Bact.S%201192.JPG"),
    ("Peach___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Peach___healthy/0116fc8b-fba1-4191-88f5-9372e39ea8ae___Rutg._HL%202476.JPG"),
    ("Pepper,_bell___Bacterial_spot", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Pepper,_bell___Bacterial_spot/00f2e69a-1e56-4160-b489-8f23e3f1a91e___JR_B.Spot%203132.JPG"),
    ("Pepper,_bell___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Pepper,_bell___healthy/001000f0-c524-4d56-ab9b-834493425e61___JR_HL%207904.JPG"),
    ("Strawberry___Leaf_scorch", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Strawberry___Leaf_scorch/00e30833-e7e0-4740-9753-3b1a20721750___RS_L.Scorch%201479.JPG"),
    ("Strawberry___healthy", "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Strawberry___healthy/00e9a2f8-950f-4899- feature___RS_HL%202206.JPG"),
]


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def download_file(url: str, dest_path: str) -> None:
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        print(f"[SKIP] {dest_path} already exists ({os.path.getsize(dest_path)} bytes)")
        return
    print(f"[DOWNLOADING] {url} -> {dest_path}")
    urllib.request.urlretrieve(url, dest_path)
    print(f"[DONE] Saved {dest_path} ({os.path.getsize(dest_path)} bytes)")


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(root_dir, "model_artifacts", "disease")
    fixtures_dir = os.path.join(root_dir, "backend", "tests", "fixtures")
    eval_dir = os.path.join(root_dir, "datasets", "plantvillage_eval")

    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(fixtures_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("=== Downloading Pretrained MobileNetV2 Disease Model ===")
    checksums = {
        "model_id": MODEL_ID,
        "revision": REVISION,
        "license": "Apache-2.0",
        "last_verified": "2026-11-13",
    }

    for filename, url in FILES_TO_DOWNLOAD.items():
        dest = os.path.join(target_dir, filename)
        download_file(url, dest)
        checksums[f"{filename}_sha256"] = compute_sha256(dest)

    checksum_file = os.path.join(target_dir, "checksums.json")
    with open(checksum_file, "w") as f:
        json.dump(checksums, f, indent=2)
    print(f"[OK] Checksums saved to {checksum_file}")

    print("\n=== Downloading Real PlantVillage Test Fixture Images ===")
    for filename, url in TEST_FIXTURE_URLS.items():
        dest = os.path.join(fixtures_dir, filename)
        try:
            download_file(url, dest)
        except Exception as e:
            print(f"[WARN] Failed to download fixture {filename}: {e}")

    print("\n=== Downloading Small PlantVillage Evaluation Sample ===")
    for label, url in EVAL_SAMPLE_URLS:
        filename = f"{label}_sample.jpg"
        dest = os.path.join(eval_dir, filename)
        try:
            download_file(url, dest)
        except Exception as e:
            print(f"[WARN] Failed to download eval image for {label}: {e}")

    print("\n=== Download Complete ===")


if __name__ == "__main__":
    main()

