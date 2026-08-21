import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

from config import (
    ACTIVE_ASSIGNMENT_STATUSES,
    INCIDENT_CAPABILITY_MAP,
    INCIDENT_SEVERITY_MAP,
    INCIDENT_STATUS_EVENT_MAP,
    INCIDENT_TYPE_LABELS,
    UNIT_STATUS_EVENT_MAP,
)
from models import (
    AcceptResponseRequest,
    DispatchRequest,
    IncidentCreate,
    IncidentStatusUpdate,
    UnitStatusUpdate,
    UserIncidentReport,
)
from services.dispatch import build_dispatch_events, validate_dispatch
from services.recommendation import recommend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="ResQNet API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, code, message, status=400, details=None):
        self.code = code
        self.message = message
        self.status = status
        self.details = details


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError):
    error = {"code": exc.code, "message": exc.message}
    if exc.details:
        error["details"] = exc.details
    return JSONResponse(status_code=exc.status, content={"error": error})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", [])[1:])
    message = f"Invalid value for {field}" if field else "Invalid request body"
    return JSONResponse(
        status_code=422, content={"error": {"code": "VALIDATION_ERROR", "message": message}}
    )


@app.exception_handler(Exception)
async def generic_error_handler(_: Request, exc: Exception):
    logger.exception("unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "Unexpected server error."}},
    )


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_event(incident_id, event_type, description, metadata=None):
    return {
        "id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
        "incidentId": incident_id,
        "type": event_type,
        "description": description,
        "metadata": metadata or {},
        "createdAt": now_iso(),
    }


def require_role(*allowed):
    async def checker(x_role: str = Header(default="DISPATCHER")):
        role = x_role.upper()
        if role not in allowed:
            raise ApiError(
                "FORBIDDEN", f"Role {role} is not permitted to perform this action.", 403
            )
        return role

    return checker


async def get_incident_or_404(incident_id):
    incident = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    if not incident:
        raise ApiError("INCIDENT_NOT_FOUND", f"Incident {incident_id} does not exist.", 404)
    return incident


async def active_assignment_unit_ids():
    return set(
        await db.incident_units.distinct(
            "unitId", {"status": {"$in": list(ACTIVE_ASSIGNMENT_STATUSES)}}
        )
    )


@api_router.get("/")
async def root():
    return {"status": "ok", "service": "resqnet"}


# ---------- Agencies ----------

@api_router.get("/agencies")
async def list_agencies():
    return await db.agencies.find({}, {"_id": 0}).to_list(200)


@api_router.get("/agencies/{agency_id}")
async def get_agency(agency_id: str):
    agency = await db.agencies.find_one({"id": agency_id}, {"_id": 0})
    if not agency:
        raise ApiError("AGENCY_NOT_FOUND", f"Agency {agency_id} does not exist.", 404)
    units = await db.units.find({"agencyId": agency_id}, {"_id": 0}).to_list(500)
    return {**agency, "units": units}


# ---------- Units ----------

@api_router.get("/units")
async def list_units(status: str = None, agencyId: str = None):
    query = {}
    if status:
        query["status"] = status.upper()
    if agencyId:
        query["agencyId"] = agencyId
    return await db.units.find(query, {"_id": 0}).to_list(500)


@api_router.get("/units/{unit_id}")
async def get_unit(unit_id: str):
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise ApiError("UNIT_NOT_FOUND", f"Unit {unit_id} does not exist.", 404)
    return unit


@api_router.patch("/units/{unit_id}/status")
async def update_unit_status(
    unit_id: str,
    body: UnitStatusUpdate,
    role: str = Depends(require_role("ADMIN", "DISPATCHER", "AGENCY_OPERATOR", "FIELD_RESPONDER")),
):
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise ApiError("UNIT_NOT_FOUND", f"Unit {unit_id} does not exist.", 404)
    update = {"status": body.status.value, "updatedAt": now_iso()}
    if body.workload is not None:
        update["workload"] = body.workload
    await db.units.update_one({"id": unit_id}, {"$set": update})

    assignment = await db.incident_units.find_one(
        {"unitId": unit_id, "status": {"$in": list(ACTIVE_ASSIGNMENT_STATUSES)}}, {"_id": 0}
    )
    if assignment:
        ts_field = {"ON_SCENE": "arrivedAt", "COMPLETED": "completedAt"}.get(body.status.value)
        assignment_update = {"status": body.status.value}
        if ts_field:
            assignment_update[ts_field] = now_iso()
        await db.incident_units.update_one(
            {"id": assignment["id"]}, {"$set": assignment_update}
        )
        event_type = UNIT_STATUS_EVENT_MAP.get(body.status.value)
        if event_type:
            await db.incident_events.insert_one(
                new_event(
                    assignment["incidentId"],
                    event_type,
                    f"{unit['name']} status changed to {body.status.value.replace('_', ' ')}",
                    {"unitId": unit_id, "unitName": unit["name"], "role": role},
                )
            )
    return await db.units.find_one({"id": unit_id}, {"_id": 0})


# ---------- Incidents ----------

@api_router.post("/incidents", status_code=201)
async def create_incident(
    body: IncidentCreate, role: str = Depends(require_role("ADMIN", "DISPATCHER"))
):
    count = await db.incidents.count_documents({})
    incident = {
        "id": f"INC-{count + 1:04d}",
        **body.model_dump(mode="json"),
        "status": "REPORTED",
        "reportedAt": now_iso(),
        "resolvedAt": None,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    await db.incidents.insert_one(incident)
    await db.incident_events.insert_one(
        new_event(
            incident["id"],
            "INCIDENT_CREATED",
            f"Incident reported: {incident['title']}",
            {"severity": incident["severity"], "role": role},
        )
    )
    incident.pop("_id", None)
    return incident


@api_router.post("/incidents/report", status_code=201)
async def report_incident(body: UserIncidentReport):
    """Public citizen incident report. Location + type + which agencies are needed."""
    requested = [a for a in body.requestedAgencies if a]
    if not requested:
        raise ApiError("AGENCY_REQUIRED", "Select at least one type of help needed.", 422)
    required_caps = INCIDENT_CAPABILITY_MAP.get(body.type.value, ["rescue"])
    count = await db.incidents.count_documents({})
    label = INCIDENT_TYPE_LABELS.get(body.type.value, "Emergency")
    incident = {
        "id": f"INC-{count + 1:04d}",
        "title": f"{label} — reported via ResQNet",
        "type": body.type.value,
        "severity": INCIDENT_SEVERITY_MAP.get(body.type.value, "MODERATE"),
        "status": "REPORTED",
        "latitude": body.latitude,
        "longitude": body.longitude,
        "description": body.description or "",
        "peopleAffected": 0,
        "requiredCapabilities": required_caps,
        "requestedAgencies": requested,
        "reporterId": body.reporterId,
        "reporterName": body.reporterName,
        "source": "CITIZEN",
        "reportedAt": now_iso(),
        "resolvedAt": None,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    await db.incidents.insert_one(incident)
    await db.incident_events.insert_one(
        new_event(
            incident["id"],
            "INCIDENT_CREATED",
            f"Citizen reported: {label}",
            {"severity": incident["severity"], "requestedAgencies": requested, "source": "CITIZEN"},
        )
    )
    incident.pop("_id", None)
    return incident


@api_router.get("/incidents")
async def list_incidents(status: str = None, reporterId: str = None):
    query = {}
    if status:
        query["status"] = status.upper()
    if reporterId:
        query["reporterId"] = reporterId
    return await db.incidents.find(query, {"_id": 0}).sort("createdAt", -1).to_list(500)


@api_router.get("/agencies/{agency_id}/incidents")
async def agency_incidents(agency_id: str):
    """Active incidents relevant to an agency (its type requested, or unrouted)."""
    agency = await db.agencies.find_one({"id": agency_id}, {"_id": 0})
    if not agency:
        raise ApiError("AGENCY_NOT_FOUND", f"Agency {agency_id} does not exist.", 404)
    active = {"$in": ["REPORTED", "ASSESSING", "RESPONDING", "ON_SCENE", "CONTROLLED"]}
    query = {
        "status": active,
        "$or": [
            {"requestedAgencies": agency["type"]},
            {"requestedAgencies": {"$exists": False}},
            {"requestedAgencies": {"$size": 0}},
        ],
    }
    incidents = await db.incidents.find(query, {"_id": 0}).sort("createdAt", -1).to_list(500)
    for inc in incidents:
        inc["responses"] = await db.incident_responses.find(
            {"incidentId": inc["id"]}, {"_id": 0}
        ).to_list(50)
    return incidents


@api_router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    incident = await get_incident_or_404(incident_id)
    assignments = await db.incident_units.find(
        {"incidentId": incident_id}, {"_id": 0}
    ).to_list(100)
    for assignment in assignments:
        unit = await db.units.find_one({"id": assignment["unitId"]}, {"_id": 0})
        assignment["unit"] = unit
    responses = await db.incident_responses.find(
        {"incidentId": incident_id}, {"_id": 0}
    ).to_list(50)
    return {**incident, "assignments": assignments, "responses": responses}


@api_router.post("/incidents/{incident_id}/accept")
async def accept_incident(
    incident_id: str,
    body: AcceptResponseRequest,
    actor_role: str = Depends(require_role("ADMIN", "DISPATCHER", "AGENCY_OPERATOR")),
):
    incident = await get_incident_or_404(incident_id)
    agency = await db.agencies.find_one({"id": body.agencyId}, {"_id": 0})
    if not agency:
        raise ApiError("AGENCY_NOT_FOUND", f"Agency {body.agencyId} does not exist.", 404)
    existing = await db.incident_responses.find_one(
        {"incidentId": incident_id, "agencyId": body.agencyId}, {"_id": 0}
    )
    if existing:
        return existing
    ts = now_iso()
    response = {
        "id": f"RES-{uuid.uuid4().hex[:8].upper()}",
        "incidentId": incident_id,
        "agencyId": body.agencyId,
        "agencyName": agency["name"],
        "agencyType": agency["type"],
        "status": "ACCEPTED",
        "acceptedAt": ts,
        "createdAt": ts,
    }
    await db.incident_responses.insert_one(response)
    response.pop("_id", None)
    if incident["status"] == "REPORTED":
        await db.incidents.update_one(
            {"id": incident_id}, {"$set": {"status": "ASSESSING", "updatedAt": ts}}
        )
    await db.incident_events.insert_one(
        new_event(
            incident_id,
            "RESPONSE_ACCEPTED",
            f"{agency['name']} accepted the response",
            {"agencyId": body.agencyId, "role": actor_role},
        )
    )
    return response


@api_router.patch("/incidents/{incident_id}/status")
async def update_incident_status(
    incident_id: str,
    body: IncidentStatusUpdate,
    role: str = Depends(require_role("ADMIN", "DISPATCHER")),
):
    incident = await get_incident_or_404(incident_id)
    update = {"status": body.status.value, "updatedAt": now_iso()}
    if body.status.value == "RESOLVED":
        update["resolvedAt"] = now_iso()
    await db.incidents.update_one({"id": incident_id}, {"$set": update})
    event_type = INCIDENT_STATUS_EVENT_MAP.get(body.status.value)
    if event_type:
        await db.incident_events.insert_one(
            new_event(
                incident_id,
                event_type,
                f"Incident {incident_id} marked {body.status.value}",
                {"role": role},
            )
        )
    return {**incident, **update}


@api_router.get("/incidents/{incident_id}/events")
async def list_incident_events(incident_id: str):
    await get_incident_or_404(incident_id)
    return await db.incident_events.find(
        {"incidentId": incident_id}, {"_id": 0}
    ).sort("createdAt", 1).to_list(500)


# ---------- Recommendations ----------

@api_router.get("/incidents/{incident_id}/recommendations")
async def get_recommendations(incident_id: str, agencyId: str = None):
    incident = await get_incident_or_404(incident_id)
    unit_query = {"agencyId": agencyId} if agencyId else {}
    units = await db.units.find(unit_query, {"_id": 0}).to_list(500)
    busy = await active_assignment_unit_ids()
    result = recommend(incident, units, busy)
    events = [
        new_event(
            incident_id,
            "UNIT_RECOMMENDED",
            f"{r['unitName']} recommended (score {r['score']}, {r['distanceKm']} km)",
            {"unitId": r["unitId"], "score": r["score"], "distanceKm": r["distanceKm"]},
        )
        for r in result["recommendations"]
    ]
    if events:
        await db.incident_events.insert_many(events)
    return result


# ---------- Dispatch ----------

@api_router.post("/incidents/{incident_id}/dispatch")
async def dispatch_units(
    incident_id: str,
    body: DispatchRequest,
    role: str = Depends(require_role("ADMIN", "DISPATCHER", "AGENCY_OPERATOR")),
    x_agency_id: str = Header(default=None),
):
    incident = await get_incident_or_404(incident_id)
    unit_docs = await db.units.find({"id": {"$in": body.unitIds}}, {"_id": 0}).to_list(100)
    units_by_id = {u["id"]: u for u in unit_docs}
    if role == "AGENCY_OPERATOR" and x_agency_id:
        foreign = [u["id"] for u in unit_docs if u.get("agencyId") != x_agency_id]
        if foreign:
            raise ApiError(
                "FORBIDDEN", "You can only dispatch units belonging to your agency.", 403
            )
    assigned = await active_assignment_unit_ids()

    errors = validate_dispatch(incident, body.unitIds, units_by_id, assigned)
    if errors:
        raise ApiError(errors[0]["code"], errors[0]["message"], 409, details=errors)

    ts = now_iso()
    assignments = [
        {
            "id": f"IU-{uuid.uuid4().hex[:8].upper()}",
            "incidentId": incident_id,
            "unitId": uid,
            "status": "DISPATCHED",
            "assignedAt": ts,
            "dispatchedAt": ts,
            "arrivedAt": None,
            "completedAt": None,
        }
        for uid in body.unitIds
    ]
    await db.incident_units.insert_many(assignments)
    for assignment in assignments:
        assignment.pop("_id", None)
    await db.units.update_many(
        {"id": {"$in": body.unitIds}}, {"$set": {"status": "EN_ROUTE", "updatedAt": ts}}
    )
    if incident["status"] in {"REPORTED", "ASSESSING"}:
        await db.incidents.update_one(
            {"id": incident_id}, {"$set": {"status": "RESPONDING", "updatedAt": ts}}
        )
    dispatched_units = [units_by_id[uid] for uid in body.unitIds]
    events = [
        {**e, "id": f"EVT-{uuid.uuid4().hex[:8].upper()}", "createdAt": ts, "metadata": {**e["metadata"], "role": role}}
        for e in build_dispatch_events(incident, dispatched_units)
    ]
    await db.incident_events.insert_many(events)

    updated = await get_incident_or_404(incident_id)
    return {"incident": updated, "assignments": assignments}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
