import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score, log_loss
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

df = pd.read_csv('datasets/crop_recommendation.csv')
features_3 = ['temperature', 'humidity', 'rainfall']
X = df[features_3].values
y = df['label'].values
classes = np.unique(y)

models = {
    'RandomForest': lambda: RandomForestClassifier(n_estimators=100, random_state=42),
    'ExtraTrees': lambda: ExtraTreesClassifier(n_estimators=100, random_state=42),
    'HistGradientBoosting': lambda: HistGradientBoostingClassifier(random_state=42),
    'DecisionTree': lambda: DecisionTreeClassifier(random_state=42),
    'GaussianNB': lambda: GaussianNB(),
    'KNeighbors': lambda: Pipeline([('scaler', StandardScaler()), ('clf', KNeighborsClassifier())]),
    'LogisticRegression': lambda: Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression(max_iter=1000, random_state=42))]),
    'SVC': lambda: Pipeline([('scaler', StandardScaler()), ('clf', SVC(probability=True, random_state=42))]),
}

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("3-FEATURE (WEATHER-ONLY) BENCHMARK (temperature, humidity, rainfall):")
header = f"{'Model':22s} | {'CV Acc (Mean +/- Std)':22s} | {'CV Macro-F1 (Mean +/- Std)':27s} | {'CV Log-Loss (Mean +/- Std)':27s}"
print(header)
print("-" * len(header))

results = []
for name, factory in models.items():
    accs, f1s, lls = [], [], []
    for train_idx, val_idx in skf.split(X, y):
        clf = factory()
        clf.fit(X[train_idx], y[train_idx])
        preds = clf.predict(X[val_idx])
        probs = clf.predict_proba(X[val_idx])
        accs.append(accuracy_score(y[val_idx], preds))
        f1s.append(f1_score(y[val_idx], preds, average='macro'))
        probs_clipped = np.clip(probs, 1e-15, 1 - 1e-15)
        probs_clipped /= probs_clipped.sum(axis=1, keepdims=True)
        lls.append(log_loss(y[val_idx], probs_clipped, labels=classes))
    rec = {
        'model': name,
        'acc_mean': np.mean(accs),
        'acc_std': np.std(accs),
        'f1_mean': np.mean(f1s),
        'f1_std': np.std(f1s),
        'll_mean': np.mean(lls),
        'll_std': np.std(lls),
    }
    results.append(rec)
    print(f"{name:22s} | {rec['acc_mean']*100:5.2f}% +/- {rec['acc_std']*100:4.2f}%      | {rec['f1_mean']*100:5.2f}% +/- {rec['f1_std']*100:4.2f}%         | {rec['ll_mean']:6.4f} +/- {rec['ll_std']:6.4f}")

# Sort by CV Macro-F1
results_sorted = sorted(results, key=lambda x: x['f1_mean'], reverse=True)
print("\nRANKED BY CV MACRO-F1:")
for r in results_sorted:
    print(f"  {r['model']:22s}: Macro-F1 = {r['f1_mean']*100:5.2f}%, Accuracy = {r['acc_mean']*100:5.2f}%, Log-Loss = {r['ll_mean']:6.4f}")
