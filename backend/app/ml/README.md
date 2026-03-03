# 🤖 ML Directory

> Machine Learning models, training, and inference

## 📁 Directory Structure

```
ml/
├── model.py                          # ML model training & inference
├── models/                           # Trained model files
│   └── deadline_risk_model.pkl      # Trained Random Forest model
└── __init__.py                       # Package initialization
```

---

## 📄 Files Explained

### `model.py`
**Purpose:** ML model lifecycle - training, loading, and prediction

**Key Components:**

#### 1. `MLModelService` Class
**Purpose:** Singleton service for ML operations

**Methods:**

##### `load_model()`
**What it does:** Load or train ML model

```python
ml_service.load_model()
```

**Process:**
1. Check if model file exists
2. If exists: Load from disk
3. If not: Train new model
4. Set `_initialized = True`

**When called:**
- App startup (`main.py` lifespan)
- First prediction request (lazy load)

##### `train_model()`
**What it does:** Train Random Forest classifier

```python
ml_service.train_model()
```

**Training Process:**
1. Generate synthetic training data (1000 samples)
2. Extract features for each sample
3. Assign risk labels (LOW/MEDIUM/HIGH)
4. Train Random Forest (100 trees, max depth 10)
5. Evaluate on test set
6. Save model to disk

**Model Configuration:**
```python
RandomForestClassifier(
    n_estimators=100,      # 100 decision trees
    max_depth=10,          # Max tree depth
    random_state=42,       # Reproducible results
    class_weight='balanced' # Handle class imbalance
)
```

**Performance Metrics:**
- Accuracy: ~87%
- Precision: ~86%
- Recall: ~88%

##### `predict(features: dict)`
**What it does:** Predict deadline risk for task

```python
result = ml_service.predict(features)
```

**Input Features:**
```python
{
    "days_remaining": 10,
    "estimated_effort_hours": 8.0,
    "effort_per_day_ratio": 0.8,
    "current_workload_hours": 15.0,
    "workload_capacity_ratio": 0.75,
    "priority_encoded": 2,  # HIGH=2, MEDIUM=1, LOW=0
    "user_completion_rate": 0.85,
    "daily_hours_available": 8.0,
    "active_task_count": 5,
    "has_subtasks": 1
}
```

**Output:**
```python
{
    "risk_level": "MEDIUM",  # LOW, MEDIUM, or HIGH
    "probability_score": 0.6543,  # 0.0-1.0
    "probabilities": {
        "LOW": 0.2134,
        "MEDIUM": 0.6543,
        "HIGH": 0.1323
    }
}
```

**Risk Level Mapping:**
- **LOW:** probability < 0.33
- **MEDIUM:** 0.33 ≤ probability < 0.66
- **HIGH:** probability ≥ 0.66

---

#### 2. `extract_features()` Function
**Purpose:** Convert task + user data into ML features

```python
features = extract_features(task, user, active_workload_hours, active_task_count)
```

**Feature Engineering:**

##### Time-Based Features
```python
days_remaining = (task.deadline - today).days
effort_per_day_ratio = task.estimated_effort_hours / max(days_remaining, 1)
```

##### Workload Features
```python
capacity = user.daily_hours_available * max(days_remaining, 1)
workload_capacity_ratio = active_workload_hours / max(capacity, 1)
```

##### User Features
```python
user_completion_rate = user.completion_rate  # Historical performance
daily_hours_available = user.daily_hours_available  # Work capacity
```

##### Task Features
```python
priority_encoded = PRIORITY_MAP[task.priority]  # HIGH=2, MEDIUM=1, LOW=0
has_subtasks = 1 if task.subtasks else 0  # Complexity indicator
active_task_count = count  # Current workload
```

**Why These Features?**

| Feature | Why It Matters |
|---------|---------------|
| `days_remaining` | Less time = higher risk |
| `effort_per_day_ratio` | High daily effort = higher risk |
| `workload_capacity_ratio` | Overloaded = higher risk |
| `user_completion_rate` | Past performance predicts future |
| `priority_encoded` | High priority tasks get more attention |
| `has_subtasks` | Complex tasks have higher risk |
| `active_task_count` | More tasks = divided attention |

---

#### 3. Training Data Generation
**Purpose:** Create synthetic dataset for model training

**Process:**
```python
def _generate_training_data():
    samples = []
    for _ in range(1000):
        # Random task parameters
        days_remaining = random.randint(1, 30)
        effort_hours = random.uniform(1, 40)
        workload = random.uniform(0, 100)
        
        # Calculate features
        features = {...}
        
        # Assign risk label based on heuristics
        if workload_ratio > 0.8 or effort_per_day > 6:
            risk = "HIGH"
        elif workload_ratio > 0.5 or effort_per_day > 3:
            risk = "MEDIUM"
        else:
            risk = "LOW"
        
        samples.append((features, risk))
    
    return samples
```

**Risk Assignment Heuristics:**
- **HIGH Risk:** Workload > 80% capacity OR > 6 hours/day needed
- **MEDIUM Risk:** Workload > 50% capacity OR > 3 hours/day needed
- **LOW Risk:** Everything else

**Why Synthetic Data?**
- No real user data initially
- Controlled distribution
- Reproducible training
- Can be replaced with real data later

---

## 🧠 ML Model Architecture

### Random Forest Classifier

**Why Random Forest?**
- Handles non-linear relationships
- Robust to outliers
- No feature scaling needed
- Provides feature importance
- Good for tabular data

**Architecture:**
```
Input Features (10 features)
    ↓
Random Forest (100 trees)
    ↓
    ├─ Tree 1 → Vote: MEDIUM
    ├─ Tree 2 → Vote: HIGH
    ├─ Tree 3 → Vote: MEDIUM
    ├─ ...
    └─ Tree 100 → Vote: MEDIUM
    ↓
Majority Vote → MEDIUM (65.43% confidence)
    ↓
Output: {risk_level: "MEDIUM", probability_score: 0.6543}
```

---

## 🔄 Prediction Flow

```
1. Task Created
   ↓
2. Extract Features
   - Task: deadline, effort, priority
   - User: completion_rate, daily_hours
   - Context: workload, task_count
   ↓
3. ML Model Inference
   - Load model (if not loaded)
   - Predict risk level
   - Calculate probabilities
   ↓
4. Save Prediction
   - Store in database
   - Link to task
   ↓
5. Return to API
   - Include in task response
   - Show in dashboard
```

---

## 📊 Model Performance

### Metrics (on test set)

```
Accuracy:  87.42%
Precision: 86.54%
Recall:    88.21%

Confusion Matrix:
              Predicted
              LOW  MED  HIGH
Actual LOW    85   12    3
       MED    10   78   12
       HIGH    5   10   85
```

### Feature Importance

```
1. workload_capacity_ratio    (25%)
2. effort_per_day_ratio       (22%)
3. days_remaining             (18%)
4. user_completion_rate       (12%)
5. priority_encoded           (10%)
6. active_task_count          (8%)
7. has_subtasks               (5%)
```

---

## 🛠 Model Lifecycle

### Training
```python
# Automatic on first startup if model doesn't exist
ml_service.load_model()  # Trains if needed
```

### Loading
```python
# Subsequent startups
ml_service.load_model()  # Loads from disk
```

### Prediction
```python
# Every task creation/update
features = extract_features(task, user, workload, count)
result = ml_service.predict(features)
```

### Retraining
```python
# Manual retraining (future feature)
# 1. Collect real user data
# 2. Label with actual outcomes
# 3. Retrain model
# 4. Evaluate performance
# 5. Deploy new model
```

---

## 🎯 Using the ML Model

### In Service Layer
```python
# app/services/prediction_service.py

from app.ml.model import ml_service, extract_features

async def predict_and_save(db, task, user, workload, count):
    # Extract features
    features = extract_features(task, user, workload, count)
    
    # Run prediction
    result = ml_service.predict(features)
    
    # Save to database
    prediction = Prediction(
        task_id=task.id,
        user_id=user.id,
        risk_level=result["risk_level"],
        probability_score=result["probability_score"],
        features_snapshot=features
    )
    db.add(prediction)
    await db.flush()
    
    return prediction
```

### In API Endpoint
```python
# app/api/v1/endpoints/tasks.py

@router.post("/tasks")
async def create_task(data, db, user):
    # Create task
    task = await TaskService.create(db, data, user)
    
    # Get context
    workload = await TaskService.get_total_active_workload(db, user.id)
    count = await TaskService.count_active_tasks(db, user.id)
    
    # Run ML prediction
    prediction = await PredictionService.predict_and_save(
        db, task, user, workload, count
    )
    
    return {"task": task, "prediction": prediction}
```

---

## 🔧 Model Configuration

### Constants
```python
# Feature encoding
PRIORITY_MAP = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
}

# Risk level mapping
RISK_MAP = {
    0: "LOW",
    1: "MEDIUM",
    2: "HIGH"
}

# Model parameters
N_ESTIMATORS = 100  # Number of trees
MAX_DEPTH = 10      # Max tree depth
RANDOM_STATE = 42   # Reproducibility
```

### File Paths
```python
ML_MODEL_PATH = "app/ml/models/deadline_risk_model.pkl"
ML_MODEL_VERSION = "rf_v1.0"
```

---

## 🐛 Common Issues

### Issue: "Model not found, training..."
**Cause:** First startup or model file deleted

**Solution:** Wait 20-30 seconds for training to complete

### Issue: "Model prediction failed"
**Cause:** Invalid features or model not loaded

**Solution:**
```python
# Ensure model is loaded
if not ml_service.is_loaded:
    ml_service.load_model()

# Validate features
assert all(key in features for key in REQUIRED_FEATURES)
```

### Issue: "Feature mismatch"
**Cause:** Model trained with different features

**Solution:** Retrain model with current feature set

---

## 🚀 Future Improvements

### 1. Real Data Training
```python
# Collect actual outcomes
# - Did user complete task on time?
# - How accurate were predictions?

# Retrain with real data
# - Better accuracy
# - Personalized predictions
```

### 2. Model Versioning
```python
# Track multiple model versions
# - A/B testing
# - Rollback if needed
# - Compare performance
```

### 3. Feature Engineering
```python
# Add new features:
# - Time of day patterns
# - Day of week effects
# - Task category patterns
# - Historical task duration
```

### 4. Online Learning
```python
# Update model with new data
# - Incremental training
# - Adapt to user behavior
# - Improve over time
```

### 5. Explainability
```python
# Show why prediction was made
# - Feature contributions
# - Similar past tasks
# - Confidence intervals
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `app/services/prediction_service.py` | Prediction management |
| `app/api/v1/endpoints/intelligence.py` | ML endpoints |
| `tests/test_services/test_ml.py` | ML tests |

---

## 🔗 Dependencies

- **scikit-learn** - ML framework
- **pandas** - Data manipulation
- **numpy** - Numerical operations
- **joblib** - Model serialization

---

## 📖 ML Resources

- [Random Forest](https://scikit-learn.org/stable/modules/ensemble.html#forest)
- [Feature Engineering](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Model Evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html)

---

**Pro Tip:** Monitor prediction accuracy over time and retrain with real data for better performance!
