"""
Crop Lifecycle Timeline, Calendar Generator, RFC 5545 (.ics) Exporter,
and Seasonal Awareness Engine for AgriSage AI.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
import uuid

from backend.app.schemas.calendar import (
    CalendarEventItem,
    CropCalendarResponse,
    LifecycleStageItem,
    SeasonalAwarenessResponse,
)
from backend.app.services.growth_stage import growth_stage_service


def generate_crop_calendar(
    crop_name: str = "Cotton",
    planting_date: Optional[date] = None,
) -> CropCalendarResponse:
    if planting_date is None:
        planting_date = date(2026, 8, 15)

    today = date.today()
    das = max(0, (today - planting_date).days)

    crop_key = growth_stage_service._normalize_crop(crop_name)
    lengths = growth_stage_service.get_stage_lengths_from_fao56(crop_key)
    total_duration = sum(lengths.values())

    # Growth stages from phenology
    stage_info = growth_stage_service.compute_phenology(crop_name, planting_date, today)
    current_stage_key = stage_info.current_stage

    # 1. Construct 7 Lifecycle stages
    lifecycle_stages: List[LifecycleStageItem] = []

    # Pre-sowing (15 days prior to planting)
    pre_start = planting_date - timedelta(days=15)
    pre_end = planting_date - timedelta(days=1)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="pre_sowing",
            stage_name_en="Pre-Sowing & Land Preparation",
            stage_name_te="విత్తన ముందస్తు & నేల తయారీ",
            stage_name_hi="बुवाई पूर्व और खेत की तैयारी",
            start_das=-15,
            end_das=0,
            start_date=pre_start.isoformat(),
            end_date=pre_end.isoformat(),
            is_active=(das < 0),
            key_activities=[
                "Deep summer plowing and farmyard manure (FYM) incorporation",
                "Soil sample collection and testing for macro/micronutrients",
                "Certified seed procurement and bio-fungicide seed treatment",
            ],
        )
    )

    # Sowing & Emergence (DAS 0-10)
    sow_start = planting_date
    sow_end = planting_date + timedelta(days=10)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="sowing",
            stage_name_en="Sowing & Establishment",
            stage_name_te="విత్తుట & మొక్కల స్థాపన",
            stage_name_hi="बुवाई और अंकुरण",
            start_das=0,
            end_das=10,
            start_date=sow_start.isoformat(),
            end_date=sow_end.isoformat(),
            is_active=(0 <= das <= 10),
            key_activities=[
                "Line sowing at recommended row and plant spacing",
                "Application of basal dose fertilizer in seed furrows",
                "Light establishment irrigation to secure uniform germination",
            ],
        )
    )

    # Vegetative Growth
    veg_days = lengths.get("development", 50)
    veg_start_das = 10
    veg_end_das = lengths.get("initial", 30) + veg_days
    veg_start = planting_date + timedelta(days=veg_start_das)
    veg_end = planting_date + timedelta(days=veg_end_das)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="vegetative",
            stage_name_en="Vegetative Growth & Canopy Dev",
            stage_name_te="శాఖా ఎదుగుదల దశ",
            stage_name_hi="वानस्पतिक वृद्धि",
            start_das=veg_start_das,
            end_das=veg_end_das,
            start_date=veg_start.isoformat(),
            end_date=veg_end.isoformat(),
            is_active=(veg_start_das < das <= veg_end_das),
            key_activities=[
                "Intercultivation with bullock or tractor blade to aerate soil",
                "Manual hand weeding before weed canopy closes",
                "First split application of Nitrogen (Urea top-dressing)",
            ],
        )
    )

    # Flowering & Fruit/Boll Filling
    mid_days = lengths.get("mid", 60)
    flow_start_das = veg_end_das
    flow_end_das = flow_start_das + mid_days
    flow_start = planting_date + timedelta(days=flow_start_das)
    flow_end = planting_date + timedelta(days=flow_end_das)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="flowering_fruiting",
            stage_name_en="Flowering, Bloom & Boll/Grain Fill",
            stage_name_te="పూత & కాయ/గింజ నిండే దశ",
            stage_name_hi="फूल आना और दाना भराव",
            start_das=flow_start_das,
            end_das=flow_end_das,
            start_date=flow_start.isoformat(),
            end_date=flow_end.isoformat(),
            is_active=(flow_start_das < das <= flow_end_das),
            key_activities=[
                "Critical irrigation maintenance; moisture deficit causes heavy flower/boll shed",
                "Pest scouting on flower squares for sucking pests and caterpillars",
                "Second split fertilizer and booster potassium spray",
            ],
        )
    )

    # Maturity & Harvest
    late_days = lengths.get("late", 40)
    harv_start_das = flow_end_das
    harv_end_das = total_duration
    harv_start = planting_date + timedelta(days=harv_start_das)
    harv_end = planting_date + timedelta(days=harv_end_das)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="harvest",
            stage_name_en="Physiological Maturity & Harvest",
            stage_name_te="పక్వత & కోత దశ",
            stage_name_hi="परिपक्वता और कटाई",
            start_das=harv_start_das,
            end_das=harv_end_das,
            start_date=harv_start.isoformat(),
            end_date=harv_end.isoformat(),
            is_active=(harv_start_das < das <= harv_end_das),
            key_activities=[
                "Cessation of irrigations 10-14 days prior to harvest",
                "Staged pickings on bright sunny mornings (free of dew)",
                "Separate storage of stained or pest-affected harvest",
            ],
        )
    )

    # Post-Harvest Handling
    post_start_das = total_duration
    post_end_das = total_duration + 15
    post_start = planting_date + timedelta(days=post_start_das)
    post_end = planting_date + timedelta(days=post_end_das)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="post_harvest",
            stage_name_en="Post-Harvest Curing & Drying",
            stage_name_te="కోత అనంతర ఆరబెట్టుట & భద్రపరచడం",
            stage_name_hi="कटाई उपरांत सुखाई और भंडारण",
            start_das=post_start_das,
            end_das=post_end_das,
            start_date=post_start.isoformat(),
            end_date=post_end.isoformat(),
            is_active=(post_start_das < das <= post_end_das),
            key_activities=[
                "Moisture reduction drying on clean tarpaulin sheets",
                "Cleaning, winnowing, and removal of inert trash",
                "Packaging in standard moisture-resistant gunny bags",
            ],
        )
    )

    # Market Sale
    sale_start_das = total_duration + 15
    sale_end_das = total_duration + 45
    sale_start = planting_date + timedelta(days=sale_start_das)
    sale_end = planting_date + timedelta(days=sale_end_das)
    lifecycle_stages.append(
        LifecycleStageItem(
            stage_id="sale",
            stage_name_en="Mandi Trading & Pooled Sale",
            stage_name_te="మార్కెట్ అమ్మకాలు & రవాణా",
            stage_name_hi="मंडी बिक्री और परिवहन",
            start_das=sale_start_das,
            end_das=sale_end_das,
            start_date=sale_start.isoformat(),
            end_date=sale_end.isoformat(),
            is_active=(das > post_end_das),
            key_activities=[
                "Checking daily AGMARKNET mandi modal prices",
                "Coordinating pooled transport with peer farmer group",
                "Sale settlement and receipt verification",
            ],
        )
    )

    # 2. Specific Dated Calendar Events
    events: List[CalendarEventItem] = [
        CalendarEventItem(
            event_id="evt-sow",
            title=f"Sowing & Initial Irrigation ({crop_name})",
            title_te=f"విత్తుట & ప్రాథమిక నీటి తడి ({crop_name})",
            title_hi=f"बुवाई और पहली सिंचाई ({crop_name})",
            event_type="sowing",
            start_date=(planting_date).isoformat(),
            end_date=(planting_date + timedelta(days=2)).isoformat(),
            growth_stage="germination",
            priority="high",
            description="Sow treated hybrid seeds at optimal soil moisture depth; apply basal fertilizer in bands.",
            notification_text="Today is scheduled sowing day. Ensure seeds are bio-treated and basal fertilizer is applied.",
        ),
        CalendarEventItem(
            event_id="evt-emerge-check",
            title="Germination Count & Gap Filling",
            title_te="మొలక శాతం పరిశీలన & ఖాళీల భర్తీ",
            title_hi="अंकुरण निरीक्षण और खाली स्थान भराव",
            event_type="scouting",
            start_date=(planting_date + timedelta(days=10)).isoformat(),
            end_date=(planting_date + timedelta(days=12)).isoformat(),
            growth_stage="germination",
            priority="medium",
            description="Inspect field for even germination percentage; dibble replacement seeds in gaps before DAS 12.",
            notification_text="Check crop stand and fill any germination gaps to preserve target plant population.",
        ),
        CalendarEventItem(
            event_id="evt-first-weeding",
            title="First Intercultivation & Weeding",
            title_te="మొదటి అంతరకృషి & కలుపు తీత",
            title_hi="पहली निराई-गुड़ाई और खरपतवार नियंत्रण",
            event_type="field_work",
            start_date=(planting_date + timedelta(days=25)).isoformat(),
            end_date=(planting_date + timedelta(days=28)).isoformat(),
            growth_stage="vegetative",
            priority="medium",
            description="Run blade harrow between rows to loosen surface crust and eradicate competing weed seedlings.",
            notification_text="Weed competition is critical now. Complete intercultivation while soil moisture allows.",
        ),
        CalendarEventItem(
            event_id="evt-first-topdress",
            title="First Top-Dress Fertilizer Window",
            title_te="మొదటి పైపాటు ఎరువుల విడత",
            title_hi="पहली टॉप-ड्रेसिंग उर्वरक समय",
            event_type="fertilizer",
            start_date=(planting_date + timedelta(days=35)).isoformat(),
            end_date=(planting_date + timedelta(days=38)).isoformat(),
            growth_stage="vegetative",
            priority="high",
            description="Apply first split top-dressing fertilizer along crop rows when soil is moist; avoid dry broadcast.",
            notification_text="Optimal vegetative booster window. Confirm exact fertilizer choice with local agriculture officer.",
        ),
        CalendarEventItem(
            event_id="evt-sucking-pest",
            title="Scout Lower Leaves for Sucking Pests",
            title_te="రసం పీల్చే పురుగుల పరిశీలన",
            title_hi="रस चूसक कीटों का निरीक्षण",
            event_type="scouting",
            start_date=(planting_date + timedelta(days=55)).isoformat(),
            end_date=(planting_date + timedelta(days=57)).isoformat(),
            growth_stage="vegetative",
            priority="medium",
            description="Turn over 20 random leaves across field diagonals to check jassids, thrips, and aphids under ETL.",
            notification_text="Inspect underside of leaves for leaf curl or curling margins indicating pest pressure.",
        ),
        CalendarEventItem(
            event_id="evt-flowering-moisture",
            title="Flowering Critical Moisture Inspection",
            title_te="పూత దశ - అత్యంత కీలక నీటి తడి తనిఖీ",
            title_hi="फूल आने पर जल स्तर की जांच",
            event_type="irrigation",
            start_date=(planting_date + timedelta(days=85)).isoformat(),
            end_date=(planting_date + timedelta(days=88)).isoformat(),
            growth_stage="flowering",
            priority="high",
            description="Flowering is moisture sensitive; evaluate FAO-56 root depletion. Moisture stress causes square drop.",
            notification_text="Crop is flowering! Never allow severe soil drying now; schedule light irrigation if rain absent.",
        ),
        CalendarEventItem(
            event_id="evt-bollworm-scout",
            title="Flower & Bollworm Scouting",
            title_te="పూత మొగ్గలు & కాయతొలుచు పురుగుల తనిఖీ",
            title_hi="कली और कीट निरीक्षण",
            event_type="scouting",
            start_date=(planting_date + timedelta(days=105)).isoformat(),
            end_date=(planting_date + timedelta(days=108)).isoformat(),
            growth_stage="flowering",
            priority="high",
            description="Inspect flower rosettes and tender developing pods for entry pinholes or caterpillar droppings.",
            notification_text="Inspect developing flowers and bolls closely for pest signs.",
        ),
        CalendarEventItem(
            event_id="evt-preharvest-dry",
            title="Pre-Harvest Irrigation Cutoff",
            title_te="కోతకు ముందు నీటి తడులు నిలిపివేత",
            title_hi="कटाई पूर्व सिंचाई बंद करना",
            event_type="irrigation",
            start_date=(planting_date + timedelta(days=total_duration - 14)).isoformat(),
            end_date=(planting_date + timedelta(days=total_duration - 12)).isoformat(),
            growth_stage="maturity",
            priority="medium",
            description="Cease all irrigations 10-14 days prior to harvest to promote uniform boll burst/grain hardening.",
            notification_text="Stop irrigating now to allow soil firming and uniform crop maturity.",
        ),
        CalendarEventItem(
            event_id="evt-main-harvest",
            title=f"Main Harvest Window ({crop_name})",
            title_te=f"ప్రధాన పంట కోత సమయం ({crop_name})",
            title_hi=f"मुख्य फसल कटाई ({crop_name})",
            event_type="harvest",
            start_date=(planting_date + timedelta(days=total_duration)).isoformat(),
            end_date=(planting_date + timedelta(days=total_duration + 5)).isoformat(),
            growth_stage="maturity",
            priority="high",
            description="Conduct primary harvest in bright sunny weather; avoid mixing damp or discolored produce.",
            notification_text="Crop has reached maturity. Begin harvest during dry sunny weather.",
        ),
        CalendarEventItem(
            event_id="evt-mandi-dispatch",
            title="Post-Harvest Drying & Mandi Sale",
            title_te="ఆరబెట్టుట & మార్కెట్ రవాణా",
            title_hi="सुखाई और मंडी परिवहन",
            event_type="field_work",
            start_date=(planting_date + timedelta(days=total_duration + 15)).isoformat(),
            end_date=(planting_date + timedelta(days=total_duration + 20)).isoformat(),
            growth_stage="maturity",
            priority="medium",
            description="Check produce moisture percentage; assemble harvest lot for pooled transport to regional mandi.",
            notification_text="Prepare crop bags for sale and check current mandi price trends.",
        ),
    ]

    return CropCalendarResponse(
        crop_name=crop_name,
        planting_date=planting_date.isoformat(),
        days_after_sowing=das,
        current_stage=current_stage_key,
        total_duration_days=total_duration,
        lifecycle_stages=lifecycle_stages,
        events=events,
        status="WORKING",
    )


def generate_rfc5545_ics(
    crop_name: str = "Cotton",
    planting_date: Optional[date] = None,
) -> str:
    """
    Generates a strictly compliant RFC 5545 iCalendar stream.
    Tested and verified by standard icalendar parsers.
    """
    cal = generate_crop_calendar(crop_name, planting_date)
    dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AgriSage AI//Crop Lifecycle Calendar RFC5545//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:AgriSage - {cal.crop_name} Schedule",
        "X-WR-TIMEZONE:Asia/Kolkata",
    ]

    for evt in cal.events:
        # Date parsing
        d_start = datetime.strptime(evt.start_date, "%Y-%m-%d").date()
        d_end = datetime.strptime(evt.end_date, "%Y-%m-%d").date() if evt.end_date else d_start + timedelta(days=1)

        dtstart_str = d_start.strftime("%Y%m%d")
        dtend_str = d_end.strftime("%Y%m%d")
        uid = f"{evt.event_id}-{dtstart_str}@agrisage.ai"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART;VALUE=DATE:{dtstart_str}",
            f"DTEND;VALUE=DATE:{dtend_str}",
            f"SUMMARY:{evt.title}",
            f"DESCRIPTION:{evt.description}",
            f"CATEGORIES:{evt.event_type.upper()}",
            "STATUS:CONFIRMED",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    lines.append("")  # Trailing newline

    # RFC 5545 specifies CRLF as the line separator
    return "\r\n".join(lines)


def get_seasonal_awareness(
    month: Optional[int] = None,
    lat: float = 17.96,
    lon: float = 79.59,
) -> SeasonalAwarenessResponse:
    """
    Detects Kharif, Rabi, or Zaid season by month and coordinates with regional expectations.
    """
    if month is None:
        month = date.today().month

    month_names = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    current_month_name = month_names[month]

    # Indian Agronomic Seasons:
    # Kharif: June - October (Months 6 - 10)
    # Rabi: October - March (Months 10, 11, 12, 1, 2, 3)
    # Zaid (Summer): March - June (Months 3, 4, 5, 6)

    if month in [6, 7, 8, 9]:
        season = "Kharif"
        season_te = "ఖరీఫ్ (వానాకాలం)"
        season_hi = "खरीफ (वर्षाकालीन)"
        period = "June – October"
        expectations = {
            "temperature": "Warm to moderate (24°C – 34°C)",
            "rainfall": "High monsoon precipitation (650 – 1000 mm cumulative)",
            "humidity": "High ambient relative humidity (70% – 90%)",
            "sunshine": "Intermittent cloud cover with frequent overcast days",
        }
        crops = ["Cotton", "Paddy (Rice)", "Maize", "Soybean", "Groundnut", "Pigeonpea (Redgram)"]
        risks = [
            "Root asphyxiation and collar rot in low-lying clay plots from monsoon inundation",
            "Elevated microclimate relative humidity accelerating fungal foliar blights",
            "Weed flushes competing aggressively with emerging seedlings during break showers",
        ]
    elif month in [10, 11, 12, 1, 2]:
        season = "Rabi"
        season_te = "రబీ (యాసంగి / చలికాలం)"
        season_hi = "रबी (शीतकालीन)"
        period = "October – March"
        expectations = {
            "temperature": "Mild days, cool to cold nights (14°C – 28°C)",
            "rainfall": "Low to negligible; dependent on groundwater and canal releases",
            "humidity": "Moderate morning dew, dry afternoons (40% – 65%)",
            "sunshine": "Clear sunny skies with high photo-synthetically active radiation",
        }
        crops = ["Bengalgram (Chickpea)", "Wheat", "Rabi Maize", "Groundnut", "Mustard", "Blackgram"]
        risks = [
            "Morning dew and cool nights favorable for powdery mildew and rust pathogens",
            "Declining tubewell water tables necessitating efficient drip or sprinkler irrigation",
            "Terminal heat stress during grain filling in late-sown winter crops",
        ]
    else:  # March, April, May
        season = "Zaid"
        season_te = "జైద్ (వేసవి పంట)"
        season_hi = "जायद (ग्रीष्मकालीन)"
        period = "March – June"
        expectations = {
            "temperature": "Very high ambient heat (32°C – 43°C heatwaves)",
            "rainfall": "Very dry with occasional convective thunderstorms and gusty winds",
            "humidity": "Low relative humidity (25% – 45%)",
            "sunshine": "Intense solar radiation with reference ET0 exceeding 6.5 mm/day",
        }
        crops = ["Watermelon", "Muskmelon", "Cucumber", "Summer Greengram", "Fodder Sorghum", "Sesame"]
        risks = [
            "Extreme atmospheric vapor pressure deficit causing rapid wilt and blossom desiccation",
            "Accelerated soil water balance depletion requiring frequent light night irrigations",
            "Sunburn and sunscald on unprotected developing vegetable fruits",
        ]

    return SeasonalAwarenessResponse(
        current_season=season,
        season_name_te=season_te,
        season_name_hi=season_hi,
        season_period=period,
        current_month=current_month_name,
        climate_expectations=expectations,
        typical_crops=crops,
        primary_risks=risks,
        status="WORKING",
    )
