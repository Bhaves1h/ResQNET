from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class IncidentType(str, Enum):
    FLOOD = "FLOOD"
    FIRE = "FIRE"
    ROAD_ACCIDENT = "ROAD_ACCIDENT"
    BUILDING_COLLAPSE = "BUILDING_COLLAPSE"
    EARTHQUAKE = "EARTHQUAKE"
    MEDICAL = "MEDICAL"
    MISSING_PERSON = "MISSING_PERSON"
    HAZMAT = "HAZMAT"
    OTHER = "OTHER"


class Severity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    ASSESSING = "ASSESSING"
    RESPONDING = "RESPONDING"
    ON_SCENE = "ON_SCENE"
    CONTROLLED = "CONTROLLED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class UnitStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    OFFLINE = "OFFLINE"
    COMPLETED = "COMPLETED"


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    type: IncidentType
    severity: Severity
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: str = ""
    peopleAffected: int = Field(default=0, ge=0)
    requiredCapabilities: List[str] = Field(min_length=1)


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class UnitStatusUpdate(BaseModel):
    status: UnitStatus
    workload: Optional[int] = Field(default=None, ge=0, le=4)


class DispatchRequest(BaseModel):
    unitIds: List[str] = Field(min_length=1)


class UserIncidentReport(BaseModel):
    type: IncidentType
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: str = Field(default="", max_length=500)
    requestedAgencies: List[str] = Field(min_length=1)
    reporterId: str = Field(min_length=3, max_length=80)
    reporterName: Optional[str] = Field(default=None, max_length=80)


class AcceptResponseRequest(BaseModel):
    agencyId: str = Field(min_length=2)
