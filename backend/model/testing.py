import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib 

# 1. Load and Feature Engineering
df = pd.read_csv('energydata_complete.csv')
df['date'] = pd.to_datetime(df['date'])

# Time Features
df['hour'] = df['date'].dt.hour
df['week'] = df['date'].dt.isocalendar().week
df['week_of_month'] = (df['date'].dt.day - 1) // 7 + 1
df['is_weekend'] = df['date'].dt.dayofweek >= 5

# 2. DBSCAN State Detection (Using Sensors)
cluster_features = ['T1', 'RH_1', 'T_out', 'RH_out']
scaler = StandardScaler()
scaled_cluster_data = scaler.fit_transform(df[cluster_features])

dbscan = DBSCAN(eps=0.5, min_samples=10)
df['cluster'] = dbscan.fit_predict(scaled_cluster_data)

# 3. Final Feature Set
features = [
    'T1', 'RH_1', 'T2', 'RH_2', 'T3', 'RH_3', 'T4', 'T5', 'T6', 'T7', 'T8', 
    'RH_8', 'T9', 'RH_9', 'T_out', 'Tdewpoint', 'hour', 'week', 
    'week_of_month', 'is_weekend', 'cluster'
]

#
X = df[features]
y = df['Appliances']

# 4. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. ExtraTrees Training
# We keep n_estimators=100 for a fair comparison with Random Forest
et_model = ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1)

param_grid = {
    'n_estimators': [100, 300, 500],
    'max_depth': [None, 20, 30],
    'min_samples_split': [2, 5],
    'max_features': [1.0, 'sqrt']
}

# 2. Initialize the Grid Search
# cv=3: We check each setting 3 times on different data "folds" to ensure it's not luck.
# n_jobs=-1: Uses all your laptop's CPU cores at HUST for speed.
grid_search = GridSearchCV(
    estimator=ExtraTreesRegressor(random_state=42),
    param_grid=param_grid,
    cv=3,
    scoring='r2',
    n_jobs=-1,
    verbose=1
)

print("Starting Hyperparameter Hunt... (This may take a minute)")
grid_search.fit(X_train, y_train)

# 3. Get the Best Model
best_et_model = grid_search.best_estimator_
y_pred_tuned = best_et_model.predict(X_test)

# 4. Final Comparison
final_r2 = r2_score(y_test, y_pred_tuned)

print("\n" + "="*30)
print("OPTIMIZED EXTRA TREES RESULTS")
print("="*30)
print(f"Best Parameters: {grid_search.best_params_}")
print(f"New R² Score:    {final_r2:.4f}")
print("="*30)

joblib.dump(best_et_model, 'hust_energy_model_v1.pkl')
print("Model saved as 'hust_energy_model_v1.pkl' - Ready for deployment!")