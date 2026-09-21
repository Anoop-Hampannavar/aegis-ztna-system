import os
import time
import joblib
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import train_and_export as a fallback builder
from train_model import train_and_export

app = FastAPI(
    title="Aegis ZTNA Policy Controller",
    description="Decentralized Zero Trust AI Gateway & Policy Decision Point",
    version="1.0.0"
)

# Allow Cross-Origin requests from localhost and Vercel dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ztna_model.joblib")

# Load model or initialize on startup
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    print("[*] Model file not found. Auto-training baseline Isolation Forest...")
    model = train_and_export(MODEL_PATH)

# In-memory circular buffer for dashboard streaming
telemetry_audit_store = []

class TelemetryPayload(BaseModel):
    user_principal: str = Field(..., example="Anoop@LAPTOP-J46QBDUG")
    target_resource: str = Field(..., example="Confidential_Doc.pdf.aegis")
    access_hour: int = Field(..., ge=0, le=23, example=22)
    keystroke_cadence: float = Field(..., ge=5.0, le=3000.0, example=204.41)
    violation_count: int = Field(default=0, ge=0, example=0)

class PolicyDecisionResponse(BaseModel):
    decision: str
    risk_score_percent: float
    is_anomaly: bool
    status_code: int
    session_token: str | None
    timestamp: str
    audit_id: str

@app.get("/")
def root():
    return {
        "system": "Aegis ZTNA Policy Controller",
        "status": "ONLINE",
        "model_loaded": model is not None,
        "policy_rule": "Risk Score < 60.0% => GRANTED"
    }

@app.post("/api/v1/evaluate-risk", response_model=PolicyDecisionResponse)
def evaluate_risk(payload: TelemetryPayload):
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            model = train_and_export(MODEL_PATH)

    # Multi-vector feature vector: [cadence, access_hour, violation_count]
    features = np.array([[
        payload.keystroke_cadence,
        float(payload.access_hour),
        float(payload.violation_count)
    ]])

    # Isolation Forest: 1 = Normal, -1 = Anomaly
    prediction = model.predict(features)[0]
    raw_score = model.decision_function(features)[0]

    # Convert decision score to risk percentage:
    # Normal user scores (>0.0) map to 10% - 35% risk
    # Anomalies (<0.0) map to 65% - 98% risk
    calculated_risk = (0.28 - raw_score) * 125.0
    risk_percent = round(float(np.clip(calculated_risk, 5.0, 98.5)), 2)

    # Zero Trust Policy threshold: Deny if anomaly or risk >= 60.0%
    is_anomaly = True if (prediction == -1 or risk_percent >= 60.0) else False
    decision = "DENIED" if is_anomaly else "GRANTED"
    session_token = f"AEGIS-SESSION-{int(time.time())}-PASS" if not is_anomaly else None

    record = {
        "audit_id": f"ZT-{int(time.time() * 1000)}",
        "user_principal": payload.user_principal,
        "target_resource": payload.target_resource,
        "cadence_ms": payload.keystroke_cadence,
        "access_hour": payload.access_hour,
        "risk_score_percent": risk_percent,
        "decision": decision,
        "tx_hash": None,  # Will link to Polygon Amoy in Brick 3
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    telemetry_audit_store.insert(0, record)

    return PolicyDecisionResponse(
        decision=decision,
        risk_score_percent=risk_percent,
        is_anomaly=is_anomaly,
        status_code=200 if not is_anomaly else 403,
        session_token=session_token,
        timestamp=record["timestamp"],
        audit_id=record["audit_id"]
    )

@app.get("/api/v1/telemetry-logs")
def get_audit_trail():
    """Provides recent access telemetry to the React dashboard."""
    return telemetry_audit_store[:30]
