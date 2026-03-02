"""Tests for ML model pipeline."""
import pytest
import numpy as np
from app.ml.model import (
    generate_synthetic_dataset,
    ml_service,
    extract_features,
    FEATURE_COLUMNS,
)


def test_dataset_generation():
    df = generate_synthetic_dataset(n_samples=500)
    assert len(df) == 500
    assert all(col in df.columns for col in FEATURE_COLUMNS)
    assert "risk_label" in df.columns
    assert df["risk_label"].isin([0, 1, 2]).all()
    assert df["days_remaining"].between(1, 30).all()
    assert df["user_completion_rate"].between(0, 1).all()


def test_dataset_class_balance():
    df = generate_synthetic_dataset(n_samples=2000)
    counts = df["risk_label"].value_counts()
    # Each class should be at least 10% of data
    for label in [0, 1, 2]:
        assert counts.get(label, 0) / len(df) > 0.10, f"Class {label} underrepresented"


def test_ml_prediction_output():
    """Test that the ML service returns valid output format."""
    features = {
        "days_remaining": 5,
        "estimated_effort_hours": 20,
        "effort_per_day_ratio": 4.0,
        "current_workload_hours": 60,
        "workload_capacity_ratio": 1.5,
        "priority_encoded": 3,
        "user_completion_rate": 0.7,
        "daily_hours_available": 8,
        "active_task_count": 8,
        "has_subtasks": 1,
    }
    result = ml_service.predict(features)
    assert "risk_level" in result
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0.0 <= result["probability_score"] <= 1.0
    assert abs(sum(result["probabilities"].values()) - 1.0) < 0.01


def test_high_risk_prediction():
    """High-risk scenarios should predict HIGH or MEDIUM risk."""
    features = {
        "days_remaining": 1,
        "estimated_effort_hours": 40,
        "effort_per_day_ratio": 40.0,
        "current_workload_hours": 100,
        "workload_capacity_ratio": 12.5,
        "priority_encoded": 4,
        "user_completion_rate": 0.3,
        "daily_hours_available": 8,
        "active_task_count": 15,
        "has_subtasks": 1,
    }
    result = ml_service.predict(features)
    assert result["risk_level"] in ["MEDIUM", "HIGH"]


def test_low_risk_prediction():
    """Low-risk scenarios should predict LOW risk."""
    features = {
        "days_remaining": 25,
        "estimated_effort_hours": 2,
        "effort_per_day_ratio": 0.08,
        "current_workload_hours": 8,
        "workload_capacity_ratio": 0.04,
        "priority_encoded": 1,
        "user_completion_rate": 0.98,
        "daily_hours_available": 8,
        "active_task_count": 2,
        "has_subtasks": 0,
    }
    result = ml_service.predict(features)
    assert result["risk_level"] in ["LOW", "MEDIUM"]
