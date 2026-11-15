import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv('datasets/crop_recommendation.csv')
features_7 = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
features_3 = ['temperature', 'humidity', 'rainfall']
y = df['label'].values

print("=" * 80)
print("DERIVING CONFIDENCE THRESHOLDS FROM 5-FOLD STRATIFIED CV PREDICTIONS")
print("=" * 80)

for feat_name, X_feats in [("7-Feature GaussianNB", df[features_7].values), ("3-Feature Weather-Only RandomForest", df[features_3].values)]:
    print(f"\n--- Model: {feat_name} ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    classes = np.unique(y)
    n_samples = len(y)
    oof_probs = np.zeros((n_samples, len(classes)))

    for train_idx, val_idx in skf.split(X_feats, y):
        if "GaussianNB" in feat_name:
            clf = GaussianNB()
        else:
            clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X_feats[train_idx], y[train_idx])
        oof_probs[val_idx] = clf.predict_proba(X_feats[val_idx])

    top1_idx = np.argmax(oof_probs, axis=1)
    top1_probs = np.max(oof_probs, axis=1)
    sorted_probs = np.sort(oof_probs, axis=1)
    top2_probs = sorted_probs[:, -2]
    gaps = top1_probs - top2_probs
    preds = classes[top1_idx]
    correct = (preds == y)

    print(f"Overall OOF Accuracy: {correct.mean():.4f}")

    records = []
    for p_thresh in [0.40, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]:
        for g_thresh in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]:
            mask = (top1_probs >= p_thresh) & (gaps >= g_thresh)
            count = mask.sum()
            if count > 0:
                prec = correct[mask].mean()
                records.append({
                    'p_thresh': p_thresh,
                    'gap_thresh': g_thresh,
                    'coverage_pct': round(count / n_samples * 100, 2),
                    'precision': round(prec * 100, 2),
                    'errors': int((~correct[mask]).sum())
                })

    res_df = pd.DataFrame(records)
    print(res_df.to_string(index=False))
