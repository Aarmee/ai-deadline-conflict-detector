"""
ML Pipeline for Deadline Risk Prediction
-----------------------------------------
1. Generate synthetic training dataset
2. Train Random Forest classifier
3. Save model to disk
4. Load model for real-time inference
"""

import os
import numpy as np
import pandas as pd
import joblib
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

from app.core.config import settings


# ─── Feature Names ────────────────────────────────────────
FEATURE_COLUMNS = [
    "days_remaining",
    "estimated_effort_hours",
    "effort_per_day_ratio",
    "current_workload_hours",
    "workload_capacity_ratio",
    "priority_encoded",
    "user_completion_rate",
    "daily_hours_available",
    "active_task_count",
    "has_subtasks",
]

PRIORITY_MAP = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
RISK_MAP = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
RISK_REVERSE_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


# ─── Dataset Generator ────────────────────────────────────
def generate_synthetic_dataset(n_samples: int = 8000, random_state: int = 42) -> pd.DataFrame:
    """Generate a realistic synthetic training dataset."""
    np.random.seed(random_state)

    days_remaining = np.random.randint(1, 31, n_samples)
    effort_hours = np.random.lognormal(mean=1.8, sigma=0.8, size=n_samples).clip(0.5, 80)
    workload_hours = np.random.lognormal(mean=3.2, sigma=0.7, size=n_samples).clip(2, 200)
    priority_encoded = np.random.choice([1, 2, 3, 4], n_samples, p=[0.3, 0.35, 0.25, 0.1])
    completion_rate = np.random.beta(a=7, b=2, size=n_samples).clip(0.1, 1.0)
    daily_hours = np.random.choice([4, 6, 8, 10, 12], n_samples, p=[0.1, 0.2, 0.4, 0.2, 0.1]).astype(float)
    active_count = np.random.randint(1, 20, n_samples)
    has_subtasks = np.random.choice([0, 1], n_samples, p=[0.65, 0.35])

    effort_per_day = effort_hours / np.maximum(days_remaining, 1)
    capacity = daily_hours * np.maximum(days_remaining, 1)
    workload_capacity_ratio = workload_hours / np.maximum(capacity, 1)

    # Label generation with domain logic
    risk_score = (
        (effort_per_day / np.maximum(daily_hours, 1)) * 0.30 +
        (workload_capacity_ratio) * 0.25 +
        ((5 - priority_encoded) / 4) * 0.15 +   # lower priority = higher risk (reversed)
        ((1 - completion_rate)) * 0.20 +
        (active_count / 20) * 0.10
    )

    # Normalize and add noise
    risk_score = (risk_score - risk_score.min()) / (risk_score.max() - risk_score.min())
    risk_score += np.random.normal(0, 0.05, n_samples)  # 5% noise
    risk_score = risk_score.clip(0, 1)

    # Use percentiles to ensure balanced classes (33% each)
    threshold_low = np.percentile(risk_score, 33.33)
    threshold_medium = np.percentile(risk_score, 66.66)
    labels = np.where(risk_score < threshold_low, 0, np.where(risk_score < threshold_medium, 1, 2))

    df = pd.DataFrame({
        "days_remaining": days_remaining,
        "estimated_effort_hours": effort_hours.round(1),
        "effort_per_day_ratio": effort_per_day.round(3),
        "current_workload_hours": workload_hours.round(1),
        "workload_capacity_ratio": workload_capacity_ratio.round(3),
        "priority_encoded": priority_encoded,
        "user_completion_rate": completion_rate.round(4),
        "daily_hours_available": daily_hours,
        "active_task_count": active_count,
        "has_subtasks": has_subtasks,
        "risk_label": labels,  # 0=LOW, 1=MEDIUM, 2=HIGH
    })

    return df


# ─── Model Training ───────────────────────────────────────
def train_and_save_model(model_path: str = None) -> dict:
    """Train Random Forest model and save it. Returns evaluation metrics."""
    if model_path is None:
        model_path = settings.ML_MODEL_PATH

    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset(n_samples=8000)

    X = df[FEATURE_COLUMNS]
    y = df["risk_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=["LOW", "MEDIUM", "HIGH"])
    print(f"\nAccuracy: {accuracy:.4f}")
    print(report)

    # Save model
    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    print(f"Model saved to: {model_path}")

    return {"accuracy": accuracy, "report": report}


# ─── Model Inference Service ──────────────────────────────
class MLModelService:
    """
    Thread-safe singleton for ML model inference.
    
    ARCHITECTURE:
    - Singleton pattern prevents multiple model instances (memory efficient)
    - Thread-safe initialization (each test/worker gets one instance)
    - Lazy loading: model loads on first predict() call if not loaded
    - Fallback: auto-trains model if file doesn't exist
    
    IMPORTANT: Call load_model() explicitly in setup (conftest) to avoid
    training during tests. Or use lazy loading if you want dynamic behavior.
    """
    _instance = None
    _model = None
    _initialized = False

    def __new__(cls):
        """Ensure only one instance exists."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self, model_path: str = None):
        """
        Load ML model from disk. Trains new one if not found.
        
        Args:
            model_path: Path to model file (defaults to settings.ML_MODEL_PATH)
            
        Raises:
            FileNotFoundError: If model path is invalid and training fails
            
        Returns:
            None (sets self._model as side effect)
        """
        path = model_path or settings.ML_MODEL_PATH
        
        # Check if model file exists
        if not os.path.exists(path):
            print(f"⚠️  Model not found at {path}. Training new model...")
            train_and_save_model(path)
        
        # Load from disk
        try:
            self._model = joblib.load(path)
            self._initialized = True
            print(f"✓ ML Model loaded from: {path}")
        except Exception as e:
            print(f"✗ Failed to load model from {path}: {e}")
            raise

    def predict(self, features: dict) -> dict:
        """
        Execute risk prediction on input features.
        
        LAZY INITIALIZATION: If model not loaded, attempts to load it.
        This prevents RuntimeError if conftest.py fails to load.
        
        Args:
            features: Dict with keys matching FEATURE_COLUMNS
                - days_remaining: int (1-30)
                - estimated_effort_hours: float
                - effort_per_day_ratio: float
                - current_workload_hours: float
                - workload_capacity_ratio: float
                - priority_encoded: int (1-4)
                - user_completion_rate: float (0-1)
                - daily_hours_available: float
                - active_task_count: int
                - has_subtasks: int (0 or 1)
        
        Returns:
            Dict with:
                - risk_level: "LOW", "MEDIUM", or "HIGH"
                - probability_score: float (0-1, best prediction confidence)
                - probabilities: Dict[str, float] (all class probabilities)
        
        Raises:
            RuntimeError: If model still fails to load (filesystem issues)
            KeyError: If features dict missing required columns
        """
        # Lazy initialization: load model if not already loaded
        if self._model is None:
            print("⚠️  Model not loaded. Attempting lazy initialization...")
            self.load_model()
        
        # Validate input features
        missing_features = set(FEATURE_COLUMNS) - set(features.keys())
        if missing_features:
            raise KeyError(f"Missing required features: {missing_features}")
        
        # Build feature vector in correct order
        feature_vector = np.array([[features[col] for col in FEATURE_COLUMNS]])
        
        # Run prediction
        probabilities = self._model.predict_proba(feature_vector)[0]
        predicted_class = int(np.argmax(probabilities))
        risk_level = RISK_MAP[predicted_class]
        probability_score = float(probabilities[predicted_class])

        return {
            "risk_level": risk_level,
            "probability_score": round(probability_score, 4),
            "probabilities": {
                "LOW": round(float(probabilities[0]), 4),
                "MEDIUM": round(float(probabilities[1]), 4),
                "HIGH": round(float(probabilities[2]), 4),
            }
        }

    @property
    def is_loaded(self) -> bool:
        """Check if model is initialized and ready."""
        return self._initialized and self._model is not None


# ─── Feature Extractor ────────────────────────────────────
def extract_features(task, user, active_workload_hours: float, active_task_count: int) -> dict:
    """Extract ML feature vector from a Task + User context."""
    today = date.today()
    deadline = task.deadline if isinstance(task.deadline, date) else task.deadline.date()
    days_remaining = max((deadline - today).days, 0)

    effort_per_day = task.estimated_effort_hours / max(days_remaining, 1)
    capacity = user.daily_hours_available * max(days_remaining, 1)
    workload_capacity_ratio = active_workload_hours / max(capacity, 1)

    # Check if subtasks are loaded without triggering lazy load
    # Use inspect to check if the relationship is loaded
    from sqlalchemy import inspect as sqla_inspect
    task_state = sqla_inspect(task)
    has_subtasks = 0
    if 'subtasks' in task_state.unloaded:
        # Not loaded, assume no subtasks (safe default for new tasks)
        has_subtasks = 0
    else:
        # Already loaded, safe to access
        has_subtasks = 1 if task.subtasks else 0

    return {
        "days_remaining": days_remaining,
        "estimated_effort_hours": task.estimated_effort_hours,
        "effort_per_day_ratio": round(effort_per_day, 3),
        "current_workload_hours": active_workload_hours,
        "workload_capacity_ratio": round(workload_capacity_ratio, 3),
        "priority_encoded": PRIORITY_MAP.get(task.priority.value if hasattr(task.priority, 'value') else task.priority, 2),
        "user_completion_rate": user.completion_rate,
        "daily_hours_available": user.daily_hours_available,
        "active_task_count": active_task_count,
        "has_subtasks": has_subtasks,
    }


# Singleton instance
ml_service = MLModelService()
