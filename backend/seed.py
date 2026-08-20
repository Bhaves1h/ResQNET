import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

NOW = datetime.now(timezone.utc).isoformat()

AGENCIES = [
    {"id": "AGY-01", "name": "Nagpur Fire & Emergency — Civil Lines", "type": "fire", "latitude": 21.1533, "longitude": 79.0610, "contact": "+91-712-2560001"},
    {"id": "AGY-02", "name": "Orange City Hospital EMS — Dharampeth", "type": "medical", "latitude": 21.1355, "longitude": 79.0616, "contact": "+91-712-2560002"},
    {"id": "AGY-03", "name": "Nagpur Police HQ — Sitabuldi", "type": "police", "latitude": 21.1453, "longitude": 79.0830, "contact": "+91-712-2560003"},
    {"id": "AGY-04", "name": "NDRF Rescue Battalion — Hingna", "type": "disaster_response", "latitude": 21.0986, "longitude": 78.9912, "contact": "+91-712-2560004"},
    {"id": "AGY-05", "name": "City Disaster Response Cell — Mahal", "type": "disaster_response", "latitude": 21.1355, "longitude": 79.0900, "contact": "+91-712-2560005"},
    {"id": "AGY-06", "name": "Lifeline Ambulance Service — Dhantoli", "type": "medical", "latitude": 21.1349, "longitude": 79.0767, "contact": "+91-712-2560006"},
    {"id": "AGY-07", "name": "Fire Station — Narendra Nagar", "type": "fire", "latitude": 21.1230, "longitude": 79.0520, "contact": "+91-712-2560007"},
    {"id": "AGY-08", "name": "Traffic Police Control — Khamla", "type": "police", "latitude": 21.1140, "longitude": 79.0560, "contact": "+91-712-2560008"},
    {"id": "AGY-09", "name": "SAR & K9 Search Unit — Sadar", "type": "rescue", "latitude": 21.1620, "longitude": 79.0810, "contact": "+91-712-2560009"},
    {"id": "AGY-10", "name": "Civil Defence Volunteers — Itwari", "type": "rescue", "latitude": 21.1540, "longitude": 79.0990, "contact": "+91-712-2560010"},
]

# id, name, agencyId, type, capabilities, status, workload, lat, lon
UNITS = [
    ("UNIT-001", "Fire Tender 01", "AGY-01", "FIRE_TRUCK", ["firefighting", "rescue", "evacuation"], "AVAILABLE", 0, 21.1540, 79.0620),
    ("UNIT-002", "Fire Tender 02", "AGY-01", "FIRE_TRUCK", ["firefighting", "rescue"], "BUSY", 2, 21.1530, 79.0600),
    ("UNIT-003", "Water Tanker 03", "AGY-01", "FIRE_TRUCK", ["firefighting"], "AVAILABLE", 1, 21.1525, 79.0615),
    ("UNIT-033", "Fire Tender 33", "AGY-01", "FIRE_TRUCK", ["firefighting"], "AVAILABLE", 0, 21.1536, 79.0618),
    ("UNIT-004", "Water Rescue Ambulance 04", "AGY-02", "AMBULANCE", ["medical", "flood_rescue", "evacuation"], "AVAILABLE", 1, 21.1440, 79.0590),
    ("UNIT-005", "Ambulance 05", "AGY-02", "AMBULANCE", ["medical"], "AVAILABLE", 0, 21.1360, 79.0620),
    ("UNIT-006", "Ambulance 06", "AGY-02", "AMBULANCE", ["medical", "rescue"], "ON_SCENE", 3, 21.1350, 79.0610),
    ("UNIT-034", "Ambulance 34", "AGY-02", "AMBULANCE", ["medical", "flood_rescue", "evacuation"], "EN_ROUTE", 2, 21.1342, 79.0608),
    ("UNIT-007", "Police Flood Response 07", "AGY-03", "POLICE", ["flood_rescue", "medical", "evacuation"], "AVAILABLE", 2, 21.1430, 79.0810),
    ("UNIT-008", "Police Interceptor 08", "AGY-03", "POLICE", ["traffic_control", "crowd_control", "search"], "AVAILABLE", 0, 21.1455, 79.0835),
    ("UNIT-009", "Police Patrol 09", "AGY-03", "POLICE", ["traffic_control", "crowd_control"], "EN_ROUTE", 2, 21.1460, 79.0825),
    ("UNIT-010", "Police Control Van 10", "AGY-03", "POLICE", ["crowd_control", "evacuation"], "OFFLINE", 4, 21.1448, 79.0832),
    ("UNIT-036", "Police Interceptor 36", "AGY-03", "POLICE", ["traffic_control", "search"], "AVAILABLE", 0, 21.1450, 79.0838),
    ("UNIT-011", "NDRF Team Alpha", "AGY-04", "RESCUE", ["flood_rescue", "evacuation", "urban_search_rescue", "hazmat"], "AVAILABLE", 1, 21.0990, 78.9920),
    ("UNIT-012", "Rescue Unit 12", "AGY-04", "RESCUE", ["flood_rescue", "urban_search_rescue", "medical", "evacuation", "rescue"], "AVAILABLE", 0, 21.1105, 79.0410),
    ("UNIT-013", "NDRF Team Bravo", "AGY-04", "RESCUE", ["flood_rescue", "evacuation", "urban_search_rescue"], "BUSY", 3, 21.0980, 78.9900),
    ("UNIT-014", "Hazmat Unit 14", "AGY-04", "RESCUE", ["hazmat", "evacuation"], "AVAILABLE", 0, 21.0995, 78.9915),
    ("UNIT-035", "NDRF Team Charlie", "AGY-04", "RESCUE", ["flood_rescue", "evacuation", "medical"], "AVAILABLE", 2, 21.0988, 78.9918),
    ("UNIT-015", "Rescue Unit 15", "AGY-05", "RESCUE", ["urban_search_rescue", "rescue", "medical"], "ON_SCENE", 3, 21.1545, 79.0985),
    ("UNIT-016", "Rescue Unit 16", "AGY-05", "RESCUE", ["urban_search_rescue", "rescue", "firefighting"], "EN_ROUTE", 2, 21.1360, 79.0895),
    ("UNIT-017", "Evacuation Team 17", "AGY-05", "RESCUE", ["evacuation", "crowd_control"], "AVAILABLE", 0, 21.1350, 79.0905),
    ("UNIT-018", "Ambulance 18", "AGY-06", "AMBULANCE", ["medical"], "AVAILABLE", 0, 21.1355, 79.0770),
    ("UNIT-019", "Ambulance 19", "AGY-06", "AMBULANCE", ["medical", "evacuation"], "BUSY", 2, 21.1345, 79.0760),
    ("UNIT-020", "Mobile ICU 20", "AGY-06", "AMBULANCE", ["medical"], "AVAILABLE", 1, 21.1352, 79.0772),
    ("UNIT-021", "Fire Tender 21", "AGY-07", "FIRE_TRUCK", ["firefighting", "rescue"], "AVAILABLE", 0, 21.1235, 79.0525),
    ("UNIT-022", "Fire Tender 22", "AGY-07", "FIRE_TRUCK", ["firefighting", "evacuation"], "AVAILABLE", 1, 21.1225, 79.0515),
    ("UNIT-023", "Rescue Boat 23", "AGY-07", "RESCUE", ["flood_rescue", "rescue", "evacuation"], "AVAILABLE", 0, 21.1240, 79.0530),
    ("UNIT-024", "Traffic Unit 24", "AGY-08", "POLICE", ["traffic_control"], "AVAILABLE", 0, 21.1145, 79.0565),
    ("UNIT-025", "Traffic Unit 25", "AGY-08", "POLICE", ["traffic_control", "crowd_control"], "BUSY", 1, 21.1135, 79.0555),
    ("UNIT-026", "Police Flood Response 26", "AGY-08", "POLICE", ["flood_rescue", "evacuation"], "AVAILABLE", 0, 21.1150, 79.0570),
    ("UNIT-027", "Search Team 27", "AGY-09", "RESCUE", ["search", "rescue"], "AVAILABLE", 0, 21.1622, 79.0812),
    ("UNIT-028", "K9 Search 28", "AGY-09", "RESCUE", ["search"], "AVAILABLE", 0, 21.1618, 79.0808),
    ("UNIT-029", "Search Team 29", "AGY-09", "RESCUE", ["search", "urban_search_rescue"], "OFFLINE", 4, 21.1625, 79.0815),
    ("UNIT-030", "Evacuation Team 30", "AGY-10", "RESCUE", ["evacuation", "crowd_control"], "AVAILABLE", 1, 21.1542, 79.0992),
    ("UNIT-031", "Rescue Unit 31", "AGY-10", "RESCUE", ["rescue", "urban_search_rescue"], "BUSY", 2, 21.1538, 79.0988),
    ("UNIT-032", "Medical Post 32", "AGY-10", "AMBULANCE", ["medical"], "AVAILABLE", 0, 21.1544, 79.0994),
]

INCIDENTS = [
    {"id": "INC-0001", "title": "Urban Flood — Ward 14, Nagpur", "type": "FLOOD", "severity": "CRITICAL", "status": "REPORTED", "latitude": 21.1245, "longitude": 79.0630, "description": "Severe waterlogging after flash rain; families stranded in low-lying homes near Ward 14.", "peopleAffected": 250, "requiredCapabilities": ["flood_rescue", "medical", "evacuation"]},
    {"id": "INC-0002", "title": "Building Collapse — Itwari", "type": "BUILDING_COLLAPSE", "severity": "HIGH", "status": "RESPONDING", "latitude": 21.1550, "longitude": 79.0990, "description": "Partial collapse of a 3-storey residential structure; people feared trapped.", "peopleAffected": 18, "requiredCapabilities": ["urban_search_rescue", "medical", "firefighting"]},
    {"id": "INC-0003", "title": "Road Accident — Zero Mile, NH-44", "type": "ROAD_ACCIDENT", "severity": "MODERATE", "status": "REPORTED", "latitude": 21.1480, "longitude": 79.0800, "description": "Multi-vehicle collision blocking the highway; injuries reported.", "peopleAffected": 6, "requiredCapabilities": ["medical", "traffic_control", "rescue"]},
    {"id": "INC-0004", "title": "Market Fire — Sitabuldi", "type": "FIRE", "severity": "HIGH", "status": "ASSESSING", "latitude": 21.1456, "longitude": 79.0826, "description": "Fire in a crowded market block; smoke inhalation risk.", "peopleAffected": 40, "requiredCapabilities": ["firefighting", "evacuation", "crowd_control"]},
    {"id": "INC-0005", "title": "Missing Person — Ambazari Lake", "type": "MISSING_PERSON", "severity": "LOW", "status": "REPORTED", "latitude": 21.1330, "longitude": 79.0430, "description": "Elderly person missing near the lake trail since morning.", "peopleAffected": 1, "requiredCapabilities": ["search"]},
    {"id": "INC-0006", "title": "Chemical Leak — MIDC Hingna", "type": "HAZMAT", "severity": "MODERATE", "status": "CONTROLLED", "latitude": 21.1010, "longitude": 78.9950, "description": "Industrial gas leak contained; area cordoned.", "peopleAffected": 12, "requiredCapabilities": ["hazmat", "evacuation"]},
]

ASSIGNMENTS = [
    {"id": "IU-0001", "incidentId": "INC-0002", "unitId": "UNIT-015", "status": "ON_SCENE", "assignedAt": NOW, "dispatchedAt": NOW, "arrivedAt": NOW, "completedAt": None},
    {"id": "IU-0002", "incidentId": "INC-0002", "unitId": "UNIT-016", "status": "EN_ROUTE", "assignedAt": NOW, "dispatchedAt": NOW, "arrivedAt": None, "completedAt": None},
]


def events():
    out = []
    n = 0
    for inc in INCIDENTS:
        n += 1
        out.append({"id": f"EVT-{n:04d}", "incidentId": inc["id"], "type": "INCIDENT_CREATED", "description": f"Incident reported: {inc['title']}", "metadata": {"severity": inc["severity"]}, "createdAt": NOW})
    for unit_id, desc in [("UNIT-015", "Rescue Unit 15 arrived on scene"), ("UNIT-016", "Rescue Unit 16 en route to Building Collapse — Itwari")]:
        n += 1
        out.append({"id": f"EVT-{n:04d}", "incidentId": "INC-0002", "type": "UNIT_ARRIVED" if "arrived" in desc else "UNIT_EN_ROUTE", "description": desc, "metadata": {"unitId": unit_id}, "createdAt": NOW})
    return out


async def main():
    for coll in ["agencies", "units", "incidents", "incident_units", "incident_events"]:
        await db[coll].delete_many({})
    await db.agencies.insert_many([{**a, "createdAt": NOW} for a in AGENCIES])
    await db.units.insert_many([
        {"id": u[0], "name": u[1], "agencyId": u[2], "type": u[3], "capabilities": u[4], "status": u[5], "workload": u[6], "latitude": u[7], "longitude": u[8], "createdAt": NOW, "updatedAt": NOW}
        for u in UNITS
    ])
    await db.incidents.insert_many([
        {**i, "reportedAt": NOW, "resolvedAt": None, "createdAt": NOW, "updatedAt": NOW}
        for i in INCIDENTS
    ])
    await db.incident_units.insert_many(ASSIGNMENTS)
    await db.incident_events.insert_many(events())
    print(f"Seeded: {len(AGENCIES)} agencies, {len(UNITS)} units, {len(INCIDENTS)} incidents")


if __name__ == "__main__":
    asyncio.run(main())
