"""
ML Pipeline for Deadline Risk Prediction
-----------------------------------------
1. Load trained Random Forest model (trained in Jupyter notebook)
2. Extract features from Task + User context
3. Run real-time inference on task creation/update

Model: Random Forest (90% accuracy, F1=0.80)
Dataset: task_dataset.csv (5000 samples)
Target: completed_on_time (0=Missed=HIGH risk, 1=OnTime=LOW risk)
"""

import os
import numpy as np
import joblib
from datetime import date
from pathlib import Path

from app.core.config import settings


# ─── Feature Columns ──────────────────────────────────────
# Must match EXACTLY the columns used during training in notebook
# Order matters — feature vector is built in this order
FEATURE_COLUMNS = [
    "user_type",
    "time_remaining",
    "estimated_hours",
    "priority",
    "dependency_count",
    "daily_available_hours",
    "workload_that_day",
    "past_delay_rate",
    "effort_gap",
    "hours_per_day_needed",
    "buffer_ratio",
    "is_overloaded",
    "time_pressure",
    "overload_ratio",
    "risk_index",
]

# Binary model: 0 = missed deadline = HIGH risk, 1 = on time = LOW risk
RISK_MAP = {0: "HIGH", 1: "LOW"}

PRIORITY_MAP = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 3}


# ─── Model Service ────────────────────────────────────────
class MLModelService:
    """
    Singleton service for ML model loading and inference.

    ARCHITECTURE:
    - Singleton pattern: only one model loaded in memory at a time
    - Lazy initialization: loads on first predict() if not already loaded
    - No auto-training: uses the model trained in Jupyter notebook
    """
    _instance = None
    _model = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self, model_path: str = None):
        """
        Load the trained Random Forest model from disk.

        Expects: backend/app/ml/models/deadline_risk_model.pkl
        This file is your random_forest.pkl renamed and copied here.

        Raises:
            FileNotFoundError: If pkl file not found at model_path
        """
        path = model_path or settings.ML_MODEL_PATH

        if not os.path.exists(path):
            raise FileNotFoundError(
                f"\n❌ Model file not found at: {path}\n"
                f"   Fix: Copy your random_forest.pkl to {path}\n"
                f"   Rename it to: deadline_risk_model.pkl"
            )

        try:
            self._model = joblib.load(path)
            self._initialized = True
            print(f"✅ ML Model loaded from: {path}")
            print(f"   Model type: {type(self._model).__name__}")
            print(f"   Features expected: {len(FEATURE_COLUMNS)}")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise

    def predict(self, features: dict) -> dict:
        """
        Run deadline risk prediction.

        Args:
            features: Dict with keys matching FEATURE_COLUMNS exactly

        Returns:
            {
                "risk_level": "HIGH" or "LOW",
                "probability_score": float (0-1, probability of missing deadline),
                "probabilities": {"HIGH": float, "LOW": float}
            }
        """
        # Lazy load if not initialized
        if self._model is None:
            print("⚠️  Model not loaded. Attempting lazy load...")
            self.load_model()

        # Validate all required features are present
        missing = set(FEATURE_COLUMNS) - set(features.keys())
        if missing:
            raise KeyError(f"Missing features: {missing}")

        # Build feature vector in exact training order
        feature_vector = np.array([[features[col] for col in FEATURE_COLUMNS]])

        # Predict
        probabilities = self._model.predict_proba(feature_vector)[0]
        predicted_class = int(np.argmax(probabilities))
        risk_level = RISK_MAP[predicted_class]

        # probability_score = probability of MISSING deadline (class 0 = HIGH risk)
        probability_score = float(probabilities[0])

        return {
            "risk_level": risk_level,
            "probability_score": round(probability_score, 4),
            "probabilities": {
                "HIGH": round(float(probabilities[0]), 4),
                "LOW":  round(float(probabilities[1]), 4),
            }
        }

    @property
    def is_loaded(self) -> bool:
        return self._initialized and self._model is not None


# ─── Feature Extractor ────────────────────────────────────
def extract_features(task, user, active_workload_hours: float, active_task_count: int) -> dict:
    """
    Extract features from a Task + User object matching the training dataset columns.

    Training dataset columns (from task_dataset.csv):
        user_type, time_remaining, estimated_hours, priority,
        dependency_count, daily_available_hours, workload_that_day,
        past_delay_rate, effort_gap, hours_per_day_needed,
        buffer_ratio, is_overloaded, time_pressure, overload_ratio, risk_index

    Args:
        task: Task ORM object (deadline, estimated_effort_hours, priority, subtasks)
        user: User ORM object (daily_hours_available, completion_rate)
        active_workload_hours: total effort hours of all active tasks for this user
        active_task_count: number of active tasks (not used in new model but kept for compatibility)

    Returns:
        Dict with exactly 15 features matching FEATURE_COLUMNS
    """
    today = date.today()
    deadline = task.deadline if isinstance(task.deadline, date) else task.deadline.date()

    # ── Core features ──────────────────────────────────────
    time_remaining = max((deadline - today).days, 1)  # min 1 to avoid division by zero
    estimated_hours = task.estimated_effort_hours
    daily_available_hours = user.daily_hours_available
    workload_that_day = active_workload_hours

    # priority: LOW=1, MEDIUM=2, HIGH=3, CRITICAL=3 (matches dataset range 1-3)
    priority_val = PRIORITY_MAP.get(
        task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
        2  # default MEDIUM
    )

    # user_type: default 0 (student) — not critical for prediction
    user_type = 0

    # dependency_count: number of subtasks this task has
    from sqlalchemy import inspect as sqla_inspect
    task_state = sqla_inspect(task)
    if 'subtasks' in task_state.unloaded:
        dependency_count = 0
    else:
        dependency_count = len(task.subtasks) if task.subtasks else 0

    # past_delay_rate: inverse of completion_rate
    # if user completes 80% on time → delay rate = 20%
    past_delay_rate = round(1.0 - float(user.completion_rate), 4)
    past_delay_rate = max(0.05, min(0.80, past_delay_rate))  # clamp to dataset range

    # ── Engineered features (must match notebook exactly) ──
    effort_gap          = workload_that_day - daily_available_hours
    hours_per_day_needed = estimated_hours / time_remaining
    buffer_ratio        = (time_remaining * daily_available_hours) / max(estimated_hours, 0.1)
    is_overloaded       = int(workload_that_day > daily_available_hours)
    time_pressure       = estimated_hours / time_remaining
    overload_ratio      = workload_that_day / max(daily_available_hours, 0.1)

    # risk_index: weighted combination (same formula as notebook)
    risk_index = (
        overload_ratio   * 0.40 +
        past_delay_rate  * 0.35 +
        time_pressure    * 0.25
    )

    return {
        "user_type":              user_type,
        "time_remaining":         time_remaining,
        "estimated_hours":        estimated_hours,
        "priority":               priority_val,
        "dependency_count":       dependency_count,
        "daily_available_hours":  daily_available_hours,
        "workload_that_day":      workload_that_day,
        "past_delay_rate":        past_delay_rate,
        "effort_gap":             round(effort_gap, 3),
        "hours_per_day_needed":   round(hours_per_day_needed, 3),
        "buffer_ratio":           round(buffer_ratio, 3),
        "is_overloaded":          is_overloaded,
        "time_pressure":          round(time_pressure, 3),
        "overload_ratio":         round(overload_ratio, 3),
        "risk_index":             round(risk_index, 4),
    }


# Singleton instance used throughout the app
ml_service = MLModelService()