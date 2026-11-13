"""
Machinery Mechanization Guide, Haversine Distance Search & Rental Service
Yuktik 2026 Hackathon | AgriSage AI Machinery Module
"""

import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in kilometers
    using the Haversine trigonometric formula.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 2)


# ==============================================================================
# Rule-Based Crop-Stage Mechanization Knowledge Base
# Indicative, to verify. Not from a published source.
# ==============================================================================

CROP_STAGE_MACHINERY_GUIDE: Dict[str, List[Dict[str, Any]]] = {
    "Cotton": [
        {
            "stage": "Land Preparation",
            "recommended_machinery": "45-55 HP Tractor with Reversible MB Plough & Rotavator",
            "category": "tractor",
            "purpose": "Deep tillage (25-30 cm) to break hardpan and prepare clean seedbed for deep taproot system.",
            "operational_hours_per_acre": 2.5,
            "cost_saving_tip": "Rotavator eliminates 2 passes of disc harrowing, saving up to 40% fuel.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Sowing",
            "recommended_machinery": "Tractor-mounted Pneumatic Seed Drill or Dibbler",
            "category": "seed_drill",
            "purpose": "Precise seed-to-seed spacing (67.5 cm × 30 cm) and uniform sowing depth (3-5 cm).",
            "operational_hours_per_acre": 1.0,
            "cost_saving_tip": "Avoids over-seeding of expensive Bt hybrid seeds; achieves 90%+ uniform emergence.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Inter-cultivation & Weeding",
            "recommended_machinery": "Power Weeder (Mini Tiller / 5HP Rotary Weeder)",
            "category": "rotavator",
            "purpose": "Mechanical shallow inter-row cultivation to eliminate early weeds and create soil mulch.",
            "operational_hours_per_acre": 1.5,
            "cost_saving_tip": "Replaces 12-15 manual labour days per acre during critical 20-45 DAS window.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Plant Protection / Flowering",
            "recommended_machinery": "Hi-Clearance Boom Sprayer or Battery-assisted Air-blast Sprayer",
            "category": "sprayer",
            "purpose": "Uniform foliar organic/biocontrol spraying without breaking branches in dense flowering canopy.",
            "operational_hours_per_acre": 0.8,
            "cost_saving_tip": "High clearance prevents square and flower drop caused by standard tractor axles.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Post-Harvest Residue Management",
            "recommended_machinery": "Tractor-drawn Cotton Stalk Shredder / Mulcher",
            "category": "harvester",
            "purpose": "Shreds woody cotton stalks in-situ to incorporate biomass and eliminate pink bollworm carryover.",
            "operational_hours_per_acre": 1.5,
            "cost_saving_tip": "Prevents open field burning; incorporates ~3 tonnes/acre of organic matter.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Rice": [
        {
            "stage": "Puddling & Land Prep",
            "recommended_machinery": "4WD 35-45 HP Tractor with Cage Wheels and Rotary Puddler",
            "category": "tractor",
            "purpose": "Uniform puddling to reduce percolation losses and prepare soft mud bed for transplanting.",
            "operational_hours_per_acre": 2.0,
            "cost_saving_tip": "Cage wheels with rotary puddler achieve desired puddling index in half the passes.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Transplanting",
            "recommended_machinery": "4-Row or 8-Row Self-Propelled Rice Transplanter",
            "category": "seed_drill",
            "purpose": "Mechanized mechanical transplanting of mat nursery seedlings at uniform hill density.",
            "operational_hours_per_acre": 1.5,
            "cost_saving_tip": "Replaces 25-30 women-labour days per acre; avoids planting delays during labour peak.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Weeding & Aeration",
            "recommended_machinery": "Motorized Cono-Weeder or 2-Row Paddy Power Weeder",
            "category": "rotavator",
            "purpose": "Incorporates weeds between flooded rows while aerating the root rhizosphere.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Improves tillering by 15-20% through soil aeration.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Harvesting & Threshing",
            "recommended_machinery": "Track-Type Combine Harvester (Paddy Special)",
            "category": "harvester",
            "purpose": "Simultaneous cutting, threshing, cleaning, and grain bin loading in wet or lodged fields.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Reduces harvesting losses from 8-12% (manual) to under 2.5%; frees field for Rabi crop.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Wheat": [
        {
            "stage": "Land Prep & Sowing",
            "recommended_machinery": "Happy Seeder / Super Seeder / Zero-Till Drill with 50HP Tractor",
            "category": "seed_drill",
            "purpose": "Direct sowing of wheat into anchored paddy residue without pre-burning or tilling.",
            "operational_hours_per_acre": 1.5,
            "cost_saving_tip": "Saves ₹2,500/acre on preparatory tillage; advances sowing date by 7-10 days.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Harvesting",
            "recommended_machinery": "Wheel-Type Combine Harvester with Straw Reaper",
            "category": "harvester",
            "purpose": "Combines grain harvesting while recovering nutrient-rich wheat straw (bhusa) for cattle.",
            "operational_hours_per_acre": 1.0,
            "cost_saving_tip": "Straw reaper recovers 15-20 quintals/acre of animal fodder worth ₹8,000-10,000.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Maize": [
        {
            "stage": "Land Preparation",
            "recommended_machinery": "Disc Harrow and Cultivator with 40-50 HP Tractor",
            "category": "tractor",
            "purpose": "Aerated, well-drained seedbed with fine aggregate structure for rapid root penetration.",
            "operational_hours_per_acre": 2.0,
            "cost_saving_tip": "Proper leveling avoids water stagnation in monsoon maize.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Sowing",
            "recommended_machinery": "Inclined Plate Planter / Ridge Planter",
            "category": "seed_drill",
            "purpose": "Precision single-seed drop on ridges to protect seedlings against waterlogging.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Ridge planting increases yield by 12% in black soils prone to water stagnation.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Harvesting & Shelling",
            "recommended_machinery": "Maize Combine Harvester / Power Dehusker-Sheller",
            "category": "harvester",
            "purpose": "High-speed dehusking and grain separation with under 1.5% broken grain.",
            "operational_hours_per_acre": 1.0,
            "cost_saving_tip": "Shells up to 25 quintals per hour compared to 1 quintal/day manual beating.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Groundnut": [
        {
            "stage": "Land Preparation",
            "recommended_machinery": "Rotavator with 40HP Tractor to Create Friable Seedbed",
            "category": "rotavator",
            "purpose": "Produces loose, pulverised topsoil (15 cm) essential for easy peg penetration.",
            "operational_hours_per_acre": 1.8,
            "cost_saving_tip": "Loose soil directly increases pod development and reduces pod loss at digging.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Digging & Inverting",
            "recommended_machinery": "Tractor-Drawn Groundnut Digger-Inverter",
            "category": "harvester",
            "purpose": "Lifts pods, vibrates loose soil, and inverts plants with pods facing sunlight for rapid drying.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Reduces in-ground pod loss from 15% (manual) to under 3%; avoids aflatoxin buildup.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Chilli": [
        {
            "stage": "Bed Preparation",
            "recommended_machinery": "Tractor-drawn Raised Bed Former & Plastic Mulch Layer",
            "category": "tractor",
            "purpose": "Prepares 90 cm raised beds, lays drip lateral and silver-black polyethylene mulch simultaneously.",
            "operational_hours_per_acre": 2.2,
            "cost_saving_tip": "Mulch retains 40% more moisture and suppresses 95% of weed emergence.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
        {
            "stage": "Spraying",
            "recommended_machinery": "Electrostatic Sprayer / Orchard Air-Carrier Sprayer",
            "category": "sprayer",
            "purpose": "Wraps spray droplets onto undersides of leaves where thrips and mites colonize.",
            "operational_hours_per_acre": 0.8,
            "cost_saving_tip": "Delivers 3x better under-leaf deposition with 40% lower spray drift.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Tomato": [
        {
            "stage": "Bed Prep & Staking",
            "recommended_machinery": "Rotary Tiller & Post Hole Digger for Trellis Staking",
            "category": "rotavator",
            "purpose": "Thorough pulverization followed by mechanised hole digging for wire trellis support.",
            "operational_hours_per_acre": 2.0,
            "cost_saving_tip": "Mechanized post digging sets 400 stakes/day vs 80 stakes/day manually.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Sugarcane": [
        {
            "stage": "Furrowing & Planting",
            "recommended_machinery": "Tractor-Mounted Sugarcane Cutter Planter",
            "category": "seed_drill",
            "purpose": "Opens furrow, cuts cane into setts, drops them, applies fertilizer, and covers in one pass.",
            "operational_hours_per_acre": 2.5,
            "cost_saving_tip": "Replaces 30 manual workers; ensures uniform sett placement and early sprouting.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Soybean": [
        {
            "stage": "Broad Bed Furrow (BBF) Sowing",
            "recommended_machinery": "Broad Bed Furrow (BBF) Planter with 45HP Tractor",
            "category": "seed_drill",
            "purpose": "Plants 4 rows on a raised bed with drainage furrows to protect seeds from excessive rain.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Prevents seedling mortality during heavy monsoon downpours in vertisols.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
    "Pulses": [
        {
            "stage": "Zero-Till Sowing",
            "recommended_machinery": "Multi-Crop Zero-Till Seed-cum-Fertilizer Drill",
            "category": "seed_drill",
            "purpose": "Sows pigeonpea, chickpea, or blackgram with precise fertilizer band placement below seed.",
            "operational_hours_per_acre": 1.2,
            "cost_saving_tip": "Optimizes starter phosphorus uptake for strong nodulation.",
            "source_note": "Indicative, to verify. Not from a published source.",
        },
    ],
}


def get_machinery_guide_for_crop(crop: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns rule-based machinery recommendations per crop and phenological stage.
    """
    if crop and crop in CROP_STAGE_MACHINERY_GUIDE:
        stages = CROP_STAGE_MACHINERY_GUIDE[crop]
        return {
            "crop": crop,
            "stages": stages,
            "total_stages": len(stages),
            "source_citation": "Indicative, to verify. Not from a published source.",
            "notes": [
                "Indicative mechanization guide; rental rates vary by village Custom Hiring Centre (CHC).",
            ],
        }

    # If no specific crop or unknown crop, return list of available crops with overview
    cotton_stages = CROP_STAGE_MACHINERY_GUIDE.get("Cotton", [])
    return {
        "crop": "All Supported Crops",
        "supported_crops": list(CROP_STAGE_MACHINERY_GUIDE.keys()),
        "stages": cotton_stages,
        "total_stages": len(cotton_stages),
        "source_citation": "Indicative, to verify. Not from a published source.",
        "notes": [
            "Select a specific crop to see stage-by-stage mechanization package.",
            "Custom hiring centres (CHCs) supported under Sub-Mission on Agricultural Mechanization (SMAM).",
        ],
    }
