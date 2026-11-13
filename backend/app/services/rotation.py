"""
Crop Rotation Engine for AgriSage AI
Rule-based agronomic recommendations based on preceding crops, botanical families,
nitrogen restoration, pathogen cycle disruption, and pest suppression.
"""

from typing import Dict, List, Optional
from backend.app.schemas.rotation import CropRotationResponse, RotationSuggestionItem

# Botanical classification of cultivated crops
CROP_FAMILY_MAP: Dict[str, str] = {
    "cotton": "Malvaceae",
    "rice": "Poaceae (Gramineae)",
    "wheat": "Poaceae (Gramineae)",
    "maize": "Poaceae (Gramineae)",
    "groundnut": "Fabaceae (Leguminosae)",
    "chilli": "Solanaceae",
    "tomato": "Solanaceae",
    "sugarcane": "Poaceae (Gramineae)",
    "soybean": "Fabaceae (Leguminosae)",
    "pulses": "Fabaceae (Leguminosae)",
    "redgram": "Fabaceae (Leguminosae)",
    "chickpea": "Fabaceae (Leguminosae)",
    "blackgram": "Fabaceae (Leguminosae)",
    "greengram": "Fabaceae (Leguminosae)",
}

ICAR_CITATION = "ICAR Indian Institute of Farming Systems Research (IIFSR) Modipuram — Cropping Systems Management Manual; to verify"
TNAU_CITATION = "Tamil Nadu Agricultural University (TNAU) Agronomy Guide on Crop Rotations & Soil Restoration; to verify"
CRIDA_CITATION = "ICAR Central Research Institute for Dryland Agriculture (CRIDA) Hyderabad — Dryland Rotation Advisory; to verify"
IIHR_CITATION = "ICAR Indian Institute of Horticultural Research (IIHR) Bangalore — Nematode & Wilt Disruption Protocols; to verify"


def recommend_rotations(previous_crop: str) -> CropRotationResponse:
    crop_clean = previous_crop.lower().strip()
    family = CROP_FAMILY_MAP.get(crop_clean, "Unknown Family")

    if crop_clean == "cotton":
        return CropRotationResponse(
            previous_crop="Cotton",
            previous_crop_family="Malvaceae",
            primary_agronomic_risks=[
                "Overwintering pink bollworm (Pectinophora gossypiella) pupae in soil litter",
                "Severe depletion of subsoil available Nitrogen and Potassium (heavy feeder)",
                "Accumulation of Verticillium and Fusarium wilt fungal inocula",
            ],
            avoid_crops=["Cotton (Monoculture)", "Chilli (Shared thrips & viral complex)", "Okra / Bhendi (Same Malvaceae family)"],
            avoid_reason="Continuous cotton perpetuates bollworm carryover and depletes soil nutrient reserves. Okra belongs to the same family and harbors identical pest complexes.",
            recommended_rotations=[
                RotationSuggestionItem(
                    crop_name="Groundnut",
                    crop_name_te="వేరుశనగ",
                    crop_name_hi="मूंगफली",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="nitrogen_fixation",
                    rationale="Nodulating Rhizobia biologically fix 30-40 kg N/ha, replenishing soil fertility mined by cotton while breaking bollworm life cycles.",
                    precaution="Ensure adequate gypsum application at flowering for pod filling in light loamy soils.",
                    suitable_seasons=["Rabi", "Summer"],
                    agronomic_source=CRIDA_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Pulses (Chickpea / Greengram)",
                    crop_name_te="పప్పుధాన్యాలు (శనగ / పెసర)",
                    crop_name_hi="दालें (चना / मूंग)",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="soil_structure",
                    rationale="Short-duration taprooted legumes break soil surface crusts, conserve residual soil moisture, and improve organic matter.",
                    precaution="Inoculate seed with Rhizobium and Trichoderma bio-fungicide to prevent dry root rot.",
                    suitable_seasons=["Rabi"],
                    agronomic_source=ICAR_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Maize / Sorghum",
                    crop_name_te="మొక్కజొన్న / జొన్న",
                    crop_name_hi="मक्का / ज्वार",
                    crop_family="Poaceae (Gramineae)",
                    benefit_category="pest_cycle_break",
                    rationale="Graminaceous cereal crops act as non-hosts for cotton bollworms, breaking insect life cycles and stimulating beneficial mycorrhizal fungi.",
                    precaution="Avoid excessive nitrogen application if subsequent crop requires low-vigor canopy.",
                    suitable_seasons=["Rabi", "Kharif"],
                    agronomic_source=TNAU_CITATION,
                    is_rule_based=True,
                ),
            ],
            status="WORKING",
        )

    elif crop_clean == "rice":
        return CropRotationResponse(
            previous_crop="Rice",
            previous_crop_family="Poaceae (Gramineae)",
            primary_agronomic_risks=[
                "Anaerobic puddled plow-pan reduces soil aeration and permeability",
                "High groundwater drawdown under continuous flood irrigation",
                "Accumulation of rice sheath blight (Rhizoctonia solani) sclerotia",
            ],
            avoid_crops=["Continuous 3rd Season Wet Rice", "Sugarcane (Compounded water table exhaustion)"],
            avoid_reason="Continuous wet paddy depletes groundwater aquifers, increases soil salinization risk, and degrades physical soil aeration.",
            recommended_rotations=[
                RotationSuggestionItem(
                    crop_name="Blackgram / Greengram (Rice-Fallow Pulses)",
                    crop_name_te="మినుము / పెసర",
                    crop_name_hi="उड़द / मूंग",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="moisture_conservation",
                    rationale="Zero-tillage broadcasting into standing stubbles utilizes residual moisture without extra irrigation and adds 25 kg organic N/acre.",
                    precaution="Broadcast seeds 2-3 days before paddy harvest while soil is moist but not saturated.",
                    suitable_seasons=["Rabi"],
                    agronomic_source=ICAR_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Groundnut",
                    crop_name_te="వేరుశనగ",
                    crop_name_hi="मूंगफली",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="nitrogen_fixation",
                    rationale="Breaks the aquatic microbial regime with an aerated oilseed root system, generating high gross margins.",
                    precaution="Requires thorough rotary plowing to break the puddled rice hardpan.",
                    suitable_seasons=["Rabi", "Summer"],
                    agronomic_source=CRIDA_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Maize",
                    crop_name_te="మొక్కజొన్న",
                    crop_name_hi="मक्का",
                    crop_family="Poaceae (Gramineae)",
                    benefit_category="soil_structure",
                    rationale="Broad-bed and furrow rabi maize produces exceptional yields in rice-fallow soils using 50% less water than summer paddy.",
                    precaution="Ensure good drainage channels to prevent seedling collar dampening.",
                    suitable_seasons=["Rabi"],
                    agronomic_source=TNAU_CITATION,
                    is_rule_based=True,
                ),
            ],
            status="WORKING",
        )

    elif crop_clean in ["chilli", "tomato"]:
        crop_disp = crop_clean.capitalize()
        return CropRotationResponse(
            previous_crop=crop_disp,
            previous_crop_family="Solanaceae",
            primary_agronomic_risks=[
                "Severe accumulation of soil-borne bacterial wilt (Ralstonia solanacearum)",
                "Root-knot nematode (Meloidogyne spp.) population buildup",
                "Viral persistence (leaf curl and geminivirus vectors)",
            ],
            avoid_crops=["Tomato", "Chilli", "Brinjal / Eggplant", "Potato (All Solanaceae)"],
            avoid_reason="Solanaceous crops share destructive soil pathogens (bacterial wilt, damping off, root-knot nematodes). Never plant consecutively without a 2-season non-host break.",
            recommended_rotations=[
                RotationSuggestionItem(
                    crop_name="Maize / Sorghum",
                    crop_name_te="మొక్కజొన్న / జొన్న",
                    crop_name_hi="मक्का / ज्वार",
                    crop_family="Poaceae (Gramineae)",
                    benefit_category="disease_prevention",
                    rationale="Immune to Ralstonia bacterial wilt and acts as a biological non-host break crop against Solanaceous nematodes.",
                    precaution="Incorporate crop residues after harvest to boost beneficial Trichoderma colonies.",
                    suitable_seasons=["Kharif", "Rabi"],
                    agronomic_source=IIHR_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Sunnhemp / Cowpea (Green Manure)",
                    crop_name_te="జనుము / అలసందలు",
                    crop_name_hi="सनई / लोबिया",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="pest_cycle_break",
                    rationale="Roots release natural nematicidal exudates that suppress root-knot nematodes while fixing up to 50 kg N/ha.",
                    precaution="Incorporate into soil at 50% flowering (45-50 DAS) before lignification.",
                    suitable_seasons=["Summer", "Kharif"],
                    agronomic_source=IIHR_CITATION,
                    is_rule_based=True,
                ),
            ],
            status="WORKING",
        )

    else:
        # Default fallback for cereals / pulses / other crops
        crop_disp = crop_clean.capitalize()
        return CropRotationResponse(
            previous_crop=crop_disp,
            previous_crop_family=family,
            primary_agronomic_risks=[
                "Specific micronutrient depletion from repeated feeding patterns",
                "Soil microbial homogeneity under uniform root exudates",
            ],
            avoid_crops=[f"Monoculture {crop_disp}"],
            avoid_reason=f"Repeating {crop_disp} continuously creates nutrient depletion niches and increases specialized pest susceptibility.",
            recommended_rotations=[
                RotationSuggestionItem(
                    crop_name="Pulses (Pigeonpea / Chickpea)",
                    crop_name_te="పప్పుధాన్యాలు",
                    crop_name_hi="दालें",
                    crop_family="Fabaceae (Leguminosae)",
                    benefit_category="nitrogen_fixation",
                    rationale="Legumes enhance microbial diversity and provide a biological nitrogen cushion for following crops.",
                    precaution="Maintain proper drainage in heavy clay soils.",
                    suitable_seasons=["Rabi", "Kharif"],
                    agronomic_source=ICAR_CITATION,
                    is_rule_based=True,
                ),
                RotationSuggestionItem(
                    crop_name="Cotton or Rice",
                    crop_name_te="పత్తి లేదా వరి",
                    crop_name_hi="कपास या धान",
                    crop_family="Malvaceae / Poaceae",
                    benefit_category="pest_cycle_break",
                    rationale="High-value cash crops utilize improved soil structure following legume or cereal rotations.",
                    precaution="Check soil test values before finalizing basal fertilizer doses.",
                    suitable_seasons=["Kharif"],
                    agronomic_source=TNAU_CITATION,
                    is_rule_based=True,
                ),
            ],
            status="WORKING",
        )
