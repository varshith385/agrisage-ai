"""
Disease Outbreak Telemetry, Village-Level Privacy Aggregation & Officer View Service
Yuktik 2026 Hackathon | AgriSage AI Outbreak Map Module
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.disease_prediction import DiseasePrediction
from backend.app.models.user import User, UserRole
from backend.app.services.location_data import INDIAN_LOCATIONS, get_villages


def get_village_coordinates(state: str, district: str, village_name: str) -> Dict[str, float]:
    """
    Retrieves centroid coordinates for a village from the Indian locations dataset.
    Falls back to district approximate coordinates if village is not in the sample directory.
    """
    v_list = get_villages(state, district)
    v_norm = village_name.strip().lower()
    for v in v_list:
        if v.get("village", "").strip().lower() == v_norm:
            return {"latitude": v["lat"], "longitude": v["lon"]}

    # Fallback centroids for Warangal villages if not in sample
    known_centroids = {
        "geikonda": {"latitude": 17.9689, "longitude": 79.5941},
        "dharmasagar": {"latitude": 17.9944, "longitude": 79.4589},
        "hasanparthy": {"latitude": 18.0667, "longitude": 79.5333},
        "inavolu": {"latitude": 17.8833, "longitude": 79.5833},
        "wardhannapet": {"latitude": 17.7667, "longitude": 79.6000},
        "atmakur": {"latitude": 18.0833, "longitude": 79.7167},
        "parkal": {"latitude": 18.2000, "longitude": 79.7167},
        "hanamkonda": {"latitude": 18.0167, "longitude": 79.5500},
    }
    if v_norm in known_centroids:
        return known_centroids[v_norm]

    # District default centroid (Warangal: 17.97, 79.60)
    return {"latitude": 17.9784, "longitude": 79.5941}


def get_outbreak_map_data(
    db: Session,
    district: Optional[str] = "Warangal",
    state: Optional[str] = "Telangana",
    days: int = 14,
    crop: Optional[str] = None,
    min_threshold: int = 3,
) -> Dict[str, Any]:
    """
    Aggregates opted-in disease predictions at the village level.
    Enforces a strict minimum-reports threshold (default: 3) to protect individual farmer privacy.
    Clusters with fewer reports than the threshold are suppressed from public display.
    """
    cutoff_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)

    query = db.query(
        DiseasePrediction.village,
        DiseasePrediction.district,
        DiseasePrediction.state,
        DiseasePrediction.predicted_disease,
        DiseasePrediction.crop_hint,
        func.count(DiseasePrediction.id).label("report_count"),
        func.avg(DiseasePrediction.confidence).label("avg_confidence"),
        func.max(DiseasePrediction.created_at).label("last_reported_at"),
    ).filter(
        DiseasePrediction.reported_to_outbreak.is_(True),
        DiseasePrediction.created_at >= cutoff_date,
    )

    if district:
        query = query.filter(DiseasePrediction.district.ilike(district.strip()))
    if state:
        query = query.filter(DiseasePrediction.state.ilike(state.strip()))
    if crop and crop.lower() != "all":
        query = query.filter(DiseasePrediction.crop_hint.ilike(f"%{crop.strip()}%"))

    grouped = (
        query.group_by(
            DiseasePrediction.village,
            DiseasePrediction.district,
            DiseasePrediction.state,
            DiseasePrediction.predicted_disease,
            DiseasePrediction.crop_hint,
        )
        .order_by(func.count(DiseasePrediction.id).desc())
        .all()
    )

    clusters: List[Dict[str, Any]] = []
    suppressed_count = 0
    total_opted_in_reports = 0

    for row in grouped:
        v_name, d_name, s_name, disease, crop_h, count, avg_conf, last_rep = row
        total_opted_in_reports += count

        # Privacy Guard: Only display clusters meeting or exceeding the minimum reports threshold
        if count < min_threshold:
            suppressed_count += 1
            continue

        coords = get_village_coordinates(s_name, d_name, v_name)

        # Classify severity
        if count >= 10:
            severity = "HIGH"
        elif count >= 5:
            severity = "MODERATE"
        else:
            severity = "LOW"

        # Format disease name cleanly (e.g. Tomato___Early_blight -> Tomato Early Blight)
        clean_disease = disease.replace("___", " - ").replace("_", " ")

        clusters.append(
            {
                "village": v_name,
                "district": d_name,
                "state": s_name,
                "latitude": coords["latitude"],
                "longitude": coords["longitude"],
                "predicted_disease": clean_disease,
                "raw_disease_key": disease,
                "crop": crop_h or "Unspecified Crop",
                "report_count": count,
                "avg_confidence": round(float(avg_conf or 0.0), 3),
                "severity": severity,
                "last_reported_at": last_rep.isoformat() if last_rep else None,
                "privacy_note": f"Aggregated across {count} anonymous opt-in farmer reports at village centroid.",
            }
        )

    # Unique villages affected
    unique_villages = len(set(c["village"] for c in clusters))

    return {
        "status": "WORKING",
        "district": district or "All",
        "state": state or "All",
        "time_window_days": days,
        "crop_filter": crop or "All",
        "min_reports_threshold": min_threshold,
        "clusters": clusters,
        "summary": {
            "total_qualifying_clusters": len(clusters),
            "total_qualifying_reports": sum(c["report_count"] for c in clusters),
            "total_opted_in_raw_reports": total_opted_in_reports,
            "suppressed_clusters_count": suppressed_count,
            "unique_villages_displayed": unique_villages,
            "privacy_guard_enforced": True,
            "headline": f"{unique_villages} village cluster(s) with active reports in the last {days} days.",
        },
    }


def get_district_officer_summary(
    db: Session,
    district: str = "Warangal",
    state: str = "Telangana",
    days: int = 30,
) -> Dict[str, Any]:
    """
    District-level agricultural officer view for Expert and Admin roles.
    Includes aggregated disease counts, crop breakdown, 4-week trend, hotspot villages, and advisories.
    """
    cutoff_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)

    # 1. Total district reports
    records = (
        db.query(DiseasePrediction)
        .filter(
            DiseasePrediction.reported_to_outbreak.is_(True),
            DiseasePrediction.district.ilike(district.strip()),
            DiseasePrediction.created_at >= cutoff_date,
        )
        .all()
    )

    total_cases = len(records)

    # 2. Disease breakdown
    disease_counts: Dict[str, int] = {}
    crop_counts: Dict[str, int] = {}
    village_counts: Dict[str, int] = {}

    for r in records:
        clean_d = r.predicted_disease.replace("___", " - ").replace("_", " ")
        disease_counts[clean_d] = disease_counts.get(clean_d, 0) + 1

        c = r.crop_hint or "General Foliage"
        crop_counts[c] = crop_counts.get(c, 0) + 1

        village_counts[r.village] = village_counts.get(r.village, 0) + 1

    diseases_sorted = [
        {"disease": k, "count": v, "pct": round(v / total_cases * 100, 1) if total_cases > 0 else 0.0}
        for k, v in sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    crops_sorted = [
        {"crop": k, "count": v, "pct": round(v / total_cases * 100, 1) if total_cases > 0 else 0.0}
        for k, v in sorted(crop_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    hotspots_sorted = [
        {"village": k, "count": v}
        for k, v in sorted(village_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # 3. Weekly trends (past 4 weeks)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    weekly_trends = []
    for w in range(4, 0, -1):
        w_start = now - timedelta(days=w * 7)
        w_end = now - timedelta(days=(w - 1) * 7)
        w_count = sum(1 for r in records if w_start <= r.created_at < w_end)
        weekly_trends.append({
            "week_label": f"W-{w} ({w_start.strftime('%d %b')})",
            "reports_count": w_count,
        })

    # 4. Officer Action Advisories
    action_advisories = [
        f"Issue Mandal Alert: Recommend preventive bio-fungicide (Trichoderma viride / Pseudomonas) spray across {hotspots_sorted[0]['village'] if hotspots_sorted else 'high-risk villages'}.",
        "Coordinate with Custom Hiring Centres (CHCs) to inspect boom sprayers for uniform canopy delivery.",
        "Ground verification: Direct Block Technology Managers (BTMs) and Agriculture Extension Officers (AEOs) to conduct random field sampling.",
    ]

    return {
        "status": "WORKING",
        "district": district,
        "state": state,
        "time_window_days": days,
        "total_cases_in_district": total_cases,
        "disease_breakdown": diseases_sorted,
        "crop_breakdown": crops_sorted,
        "weekly_trends": weekly_trends,
        "hotspot_villages": hotspots_sorted,
        "officer_action_advisories": action_advisories,
        "data_provenance": "Aggregated from opted-in farmer leaf diagnosis submissions across Mandal clusters.",
    }

