from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class RotationSuggestionItem(BaseModel):
    crop_name: str
    crop_name_te: Optional[str] = None
    crop_name_hi: Optional[str] = None
    crop_family: str
    benefit_category: Literal[
        "nitrogen_fixation",
        "pest_cycle_break",
        "disease_prevention",
        "soil_structure",
        "moisture_conservation",
    ]
    rationale: str
    precaution: str
    suitable_seasons: List[str]
    agronomic_source: str
    is_rule_based: bool = True


class CropRotationResponse(BaseModel):
    previous_crop: str
    previous_crop_family: str
    primary_agronomic_risks: List[str]
    avoid_crops: List[str]
    avoid_reason: str
    recommended_rotations: List[RotationSuggestionItem]
    source_notes: str = (
        "Rules synthesized from ICAR Indian Institute of Farming Systems Research (IIFSR) & TNAU Agronomy Guidelines; rule-based, to verify with local KVK"
    )
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
