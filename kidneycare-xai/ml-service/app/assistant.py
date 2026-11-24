"""Local routing and fail-closed response decisions."""
import asyncio
import hmac
import os
import re
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .assistant_provider import ProviderUnavailable, configured_provider
from .config import settings
from .knowledge import retrieve

router = APIRouter(prefix="/internal/assistant")
Intent = Literal["GENERAL_EDUCATION", "REPORT_LOOKUP", "REPORT_EXPLANATION", "LAB_HISTORY",
                 "REPORT_COMPARISON", "LIFESTYLE_SUMMARY", "ASSESSMENT_EXPLANATION",
                 "RECOMMENDATION_EXPLANATION", "APPLICATION_NAVIGATION", "APPOINTMENT_PREPARATION",
                 "OUT_OF_SCOPE", "URGENT_SAFETY"]
URGENT = re.compile(r"(chest (pain|pressure)|chest.{0,35}(tight|heavy|crush)|struggl.{0,30}(breathe|breath)|can.?t breathe|cannot breathe|shortness of breath|difficulty breathing|passed out|unconscious|overdose|suicid|kill myself|severe bleeding)", re.I)
PROHIBITED = re.compile(r"(diagnos|do i have|what stage|prescrib|dosage|dose\b|stop taking|start taking|treatment plan|how much water|fluid target|ignore.{0,25}instruction|system prompt|api key|credential|another user|someone else|user.?id)", re.I)
ROUTES = (
    ("APPLICATION_NAVIGATION", r"\b(where|how do i|how to|open)\b.*\b(upload|log|find|page|reports?|tracker)\b"),
    ("APPOINTMENT_PREPARATION", r"\b(appointment|prepare for my visit)\b"),
    ("REPORT_COMPARISON", r"\b(compare|comparison|difference|delta)\b"),
    ("LIFESTYLE_SUMMARY", r"\b(lifestyle|tracker|journal|hydration|sleep|exercise)\b"),
    ("ASSESSMENT_EXPLANATION", r"\b(shap|risk score|assessment|prediction)\b"),
    ("RECOMMENDATION_EXPLANATION", r"\b(recommendation|recommendations|rule)\b"),
    ("LAB_HISTORY", r"\b(trend|lab history|over time|measurements|lab results)\b"),
    ("REPORT_EXPLANATION", r"\b(explain|interpret)\b.*\breports?\b"),
    ("REPORT_LOOKUP", r"\b(reports?|health profile)\b"),
    ("GENERAL_EDUCATION", r"\b(kidney|ckd|creatinine|egfr|gfr|albumin|uacr|acr)\b"),
)
FOLLOW_UP = re.compile(r"^(and )?(what about last (month|week)|last (month|week)|and before that|tell me more)[?. ]*$", re.I)
LAB_TERMS = {
    "creatinine": "serum_creatinine", "hemoglobin": "hemoglobin", "egfr": "egfr",
    "urea": "blood_urea", "glucose": "blood_glucose_random", "sodium": "sodium",
    "potassium": "potassium", "acr": "urine_acr",
}
CONFIGURATIONS = {
    "M1": {"evidence": False, "context": False, "temporal": False, "consistency": False},
    "M2": {"evidence": True, "context": False, "temporal": False, "consistency": False},
    "M3": {"evidence": True, "context": True, "temporal": False, "consistency": False},
    "M4": {"evidence": True, "context": True, "temporal": True, "consistency": True},
}
PATIENT_INTENTS = {"REPORT_LOOKUP", "REPORT_EXPLANATION", "LAB_HISTORY", "REPORT_COMPARISON",
                   "LIFESTYLE_SUMMARY", "ASSESSMENT_EXPLANATION", "RECOMMENDATION_EXPLANATION"}


class RouteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=1000)
    previousIntent: Intent | None = None
    previousMessage: str | None = Field(default=None, max_length=1000)
    previousParameter: str | None = Field(default=None, max_length=40)


class Context(BaseModel):
    model_config = ConfigDict(extra="forbid")
    lines: list[str] = Field(default_factory=list, max_length=10)
    references: list[dict] = Field(default_factory=list, max_length=10)
    status: Literal["complete", "missing", "conflicting", "unsupported_units"] = "missing"
    recordedOn: date | None = None
    missing: list[str] = Field(default_factory=list, max_length=10)


class TurnRequest(RouteRequest):
    context: Context = Field(default_factory=Context)


class ResearchRequest(TurnRequest):
    configuration: Literal["M1", "M2", "M3", "M4"] = "M4"
    disable: set[Literal["evidence", "context", "temporal", "consistency"]] = Field(default_factory=set)
    collectDraft: bool = False


def require_secret(x_internal_secret: str = Header(default="")):
    secret = settings.ml_internal_secret
    if not secret or not hmac.compare_digest(x_internal_secret.encode(), secret.encode()):
        raise HTTPException(403, "Internal authentication required")


def route(request):
    text = request.message.strip().lower()
    parameter = next((value for term, value in LAB_TERMS.items() if re.search(r"\b" + term + r"\b", text)), None)
    if URGENT.search(text):
        intent = "URGENT_SAFETY"
    elif PROHIBITED.search(text):
        intent = "OUT_OF_SCOPE"
    elif request.previousIntent and FOLLOW_UP.fullmatch(text):
        intent = request.previousIntent
        parameter = request.previousParameter if request.previousParameter in LAB_TERMS.values() else parameter
    elif "my " in text and parameter:
        intent = "LAB_HISTORY"
    else:
        intent = next((name for name, pattern in ROUTES if re.search(pattern, text)), "OUT_OF_SCOPE")
    return {"intent": intent, "parameter": parameter, "period": "monthly" if "month" in text else "weekly",
            "latestLabs": bool(re.search(r"\b(latest|recent)\b", text)), "previousPeriod": bool(re.search(r"\blast (week|month)\b", text)), "profile": "profile" in text, "history": "list" in text or "history" in text,
            "reportIds": re.findall(r"#([0-9]{1,17})\b", text)[:2] if intent == "REPORT_COMPARISON" else []}


def result(intent, decision, answer, reason, *, context="not_required", missing=None,
           limitations=None, evidence=None, records=None, urgent=False, actions=None, model="pcer-1"):
    return {"decision": decision, "intent": intent, "answer": answer, "contextStatus": context,
            "missingInformation": missing or [], "limitations": limitations or [],
            "evidenceSources": evidence or [], "patientRecordReferences": records or [],
            "urgency": "URGENT" if urgent else "NONE", "suggestedActions": actions or [],
            "modelVersion": model, "reasonCodes": [reason], "configuration": "M4"}


async def answer(request, flags):
    intent = route(request)["intent"]
    if intent == "URGENT_SAFETY":
        return result(intent, "ABSTAIN", "These symptoms may need urgent care. Contact your local emergency services now.",
                      "URGENT_CARE", urgent=True)
    if intent == "OUT_OF_SCOPE":
        return result(intent, "ABSTAIN", "I can explain kidney-health terms and show your recorded information. A qualified clinician can advise on diagnosis and treatment.", "SCOPE_LIMIT")
    if intent == "APPLICATION_NAVIGATION":
        return result(intent, "ANSWER", "Open Medical Reports to upload a report or record a lab value. Use Daily Tracker for journal entries.",
                      "APPLICATION_GUIDANCE", actions=["/reports", "/tracker"])
    if intent == "APPOINTMENT_PREPARATION":
        return result(intent, "ANSWER", "You can review your dated laboratory results, journal and assessment before your visit. Ask your clinician which findings need follow-up.",
                      "APPOINTMENT_GUIDANCE", actions=["/reports", "/lab-history", "/tracker"])
    context = request.context
    if intent in PATIENT_INTENTS:
        if not flags["context"] or context.status == "missing" or not context.lines:
            return result(intent, "CLARIFY", "I need a matching record or more detail to show your information.",
                          "MISSING_CONTEXT", context="missing", missing=context.missing or ["matching record"])
        if flags["consistency"] and context.status != "complete":
            return result(intent, "CLARIFY", "The matching records need clarification before they can be compared.",
                          "CONTEXT_CONFLICT", context=context.status)
        historical = context.recordedOn is not None and context.recordedOn < date.today()
        if flags["temporal"] and historical and re.search(r"\b(today|current|right now)\b", request.message.lower()):
            return result(intent, "CLARIFY", f"The latest matching record is dated {context.recordedOn}. Do you have a more recent record?",
                          "HISTORICAL_ONLY", context="historical")
        return result(intent, "ANSWER", "\n".join(context.lines), "RECORDED_FACTS_ONLY", context=context.status,
                      records=context.references, limitations=["These are recorded data and do not establish a diagnosis."])
    if not flags["evidence"]:
        return result(intent, "ABSTAIN", "No reviewed source was used for this configuration.", "EVIDENCE_DISABLED")
    try:
        query = request.previousMessage if request.previousMessage and FOLLOW_UP.fullmatch(request.message.strip()) else request.message
        evidence = await asyncio.to_thread(retrieve, query)
        if not evidence:
            return result(intent, "ABSTAIN", "I could not find a reviewed source for this question.", "EVIDENCE_MISSING")
        provider = configured_provider()
        selection = await provider.select(evidence)
    except ProviderUnavailable:
        return result(intent, "ABSTAIN", "The assistant provider is temporarily unavailable.", "PROVIDER_UNAVAILABLE")
    except Exception:
        return result(intent, "ABSTAIN", "The knowledge index is temporarily unavailable.", "RETRIEVAL_UNAVAILABLE")
    match = next((item for item in evidence if item["id"] == selection.evidence_id), None)
    if not match:
        return result(intent, "ABSTAIN", "I could not verify a supporting source.", "UNSUPPORTED_CITATION", model=provider.version)
    return result(intent, "ANSWER", match["text"], "REVIEWED_EXCERPT", model=provider.version,
                  evidence=[{key: value for key, value in match.items() if key not in {"text", "tags"}}])




@router.post("/route", dependencies=[Depends(require_secret)])
async def get_route(request: RouteRequest):
    return route(request)


@router.post("/respond", dependencies=[Depends(require_secret)])
async def respond(request: TurnRequest):
    flags = CONFIGURATIONS["M4"]
    response = await answer(request, flags)
    return {**response, "retriever": os.getenv("ASSISTANT_RETRIEVER", "fixture"), "componentFlags": flags}


@router.post("/knowledge", dependencies=[Depends(require_secret)])
async def search_medical_knowledge(request: RouteRequest):
    if route(request)["intent"] != "GENERAL_EDUCATION":
        return []
    try:
        return await asyncio.to_thread(retrieve, request.message)
    except Exception:
        raise HTTPException(503, "Knowledge index unavailable") from None


@router.post("/research", dependencies=[Depends(require_secret)])
async def research(request: ResearchRequest):
    if os.getenv("ASSISTANT_SYNTHETIC_RESEARCH") != "enabled":
        raise HTTPException(404)
    flags = {name: enabled and name not in request.disable for name, enabled in CONFIGURATIONS[request.configuration].items()}
    response = await answer(request, flags)
    output = {**response, "configuration": request.configuration, "flags": flags}
    if request.collectDraft:
        # This specimen always uses bundled synthetic data, never caller-supplied text or records.
        fixture = {"question": "What is eGFR and what can I ask my clinician about these measurements?"}
        try:
            if flags["evidence"]:
                fixture["evidence"] = [{"id": item["id"], "excerpt": item["text"]}
                                       for item in await asyncio.to_thread(retrieve, "what is eGFR")]
            if flags["context"]:
                fixture["context"] = [{"value": 72, "unit": "mL/min/1.73m²", "date": "2025-10-01",
                                       "verification": "synthetic example"}]
            provider = configured_provider()
            output["researchDraft"] = {"status": "unverified", "model": provider.version,
                                       "text": await provider.research_draft(fixture)}
        except Exception:
            output["researchDraft"] = {"status": "unavailable"}
    return output
