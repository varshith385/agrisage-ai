import pandas as pd
import numpy as np

def main():
    df = pd.read_csv("datasets/crop_recommendation.csv")
    print("=== DATASET OVERVIEW ===")
    print(f"Row count: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print(f"Duplicate rows: {df.duplicated().sum()}")
    print("Missing values per column:")
    print(df.isnull().sum())
    crops = df["label"].unique()
    print(f"\nTotal crops: {len(crops)}")
    print(f"Rows per crop:\n{df['label'].value_counts()}")

    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    print("\n=== OVERALL FEATURE STATS (min, max, mean, std) ===")
    overall_stats = df[features].describe().T[["min", "max", "mean", "std"]]
    print(overall_stats.to_string())

    print("\n=== PER-CROP FEATURE STATS ===")
    pd.set_option("display.max_columns", None)
    pd.set_option("display.max_rows", None)
    pd.set_option("display.width", 1000)
    for crop in sorted(crops):
        cdf = df[df["label"] == crop][features]
        cstats = cdf.describe().T[["min", "max", "mean", "std"]]
        print(f"\n--- Crop: {crop} ---")
        print(cstats.to_string())

if __name__ == "__main__":
    main()
