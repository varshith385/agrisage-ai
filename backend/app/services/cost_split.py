"""
Transparent Cost-Splitting Calculator Service for Pooled Agricultural Logistics
Yuktik 2026 Hackathon | AgriSage AI Community Module
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


def _round_currency(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _round_pct(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


class ParticipantInput(BaseModel):
    name_or_alias: str = Field(..., description="Farmer alias or first name")
    weight_quintals: float = Field(..., gt=0, description="Load weight in quintals")
    pickup_distance_km: float = Field(..., gt=0, description="Distance from origin/pickup to destination in km")


class ParticipantSplit(BaseModel):
    name_or_alias: str
    weight_quintals: float
    pickup_distance_km: float
    share_percentage: float
    allocated_cost: float
    solo_cost: float
    savings: float
    savings_percentage: float


class CostSplitResult(BaseModel):
    split_method: str
    total_truck_cost: float
    total_solo_cost: float
    total_savings: float
    total_savings_percentage: float
    formula_breakdown: str
    example_breakdown: Dict[str, Any]
    participants: List[ParticipantSplit]
    notes: List[str]


def calculate_cost_split(
    base_truck_cost: float,
    rate_per_km: float,
    total_distance_km: float,
    participants: List[ParticipantInput],
    solo_tempo_base: float = 1200.0,
    solo_rate_per_km: float = 25.0,
    split_method: str = "weight_share",
) -> CostSplitResult:
    """
    Computes transparent cost-splitting for pooled truck logistics.
    Supports 'weight_share' (pure weight fraction) and 'ton_km' (weight * distance share).
    Computes solo trip alternative benchmark and net savings for every participant.
    """
    if not participants:
        raise ValueError("At least one participant is required to compute cost split.")

    d_base = Decimal(str(base_truck_cost))
    d_rate = Decimal(str(rate_per_km))
    d_dist = Decimal(str(total_distance_km))
    d_solo_base = Decimal(str(solo_tempo_base))
    d_solo_rate = Decimal(str(solo_rate_per_km))

    # 1. Total Pooled Truck Cost: C_truck = Base + (Rate_km * Total_Distance)
    total_truck_cost = d_base + (d_rate * d_dist)

    total_weight = sum(Decimal(str(p.weight_quintals)) for p in participants)
    if total_weight <= Decimal("0"):
        raise ValueError("Total weight must be greater than zero.")

    # 2. Compute shares based on method
    splits: List[ParticipantSplit] = []
    total_solo_sum = Decimal("0")
    total_allocated_sum = Decimal("0")

    if split_method == "ton_km":
        total_ton_km = sum(
            Decimal(str(p.weight_quintals)) * Decimal(str(p.pickup_distance_km))
            for p in participants
        )
        if total_ton_km <= Decimal("0"):
            total_ton_km = Decimal("1")
    else:
        split_method = "weight_share"
        total_ton_km = Decimal("0")

    for p in participants:
        p_wt = Decimal(str(p.weight_quintals))
        p_dist = Decimal(str(p.pickup_distance_km))

        # Solo benchmark: C_solo = solo_base + (solo_rate * distance)
        p_solo = d_solo_base + (d_solo_rate * p_dist)
        total_solo_sum += p_solo

        if split_method == "ton_km":
            p_ton_km = p_wt * p_dist
            ratio = p_ton_km / total_ton_km
        else:
            ratio = p_wt / total_weight

        p_allocated = total_truck_cost * ratio
        total_allocated_sum += p_allocated
        p_savings = p_solo - p_allocated
        p_savings_pct = (p_savings / p_solo * Decimal("100")) if p_solo > 0 else Decimal("0")
        p_share_pct = ratio * Decimal("100")

        splits.append(
            ParticipantSplit(
                name_or_alias=p.name_or_alias,
                weight_quintals=float(p_wt),
                pickup_distance_km=float(p_dist),
                share_percentage=_round_pct(p_share_pct),
                allocated_cost=_round_currency(p_allocated),
                solo_cost=_round_currency(p_solo),
                savings=_round_currency(p_savings),
                savings_percentage=_round_pct(p_savings_pct),
            )
        )

    total_savings = total_solo_sum - total_truck_cost
    total_savings_pct = (
        (total_savings / total_solo_sum * Decimal("100")) if total_solo_sum > 0 else Decimal("0")
    )

    # 3. Transparent Formula Description in Markdown / KaTeX
    formula_md = (
        "### Transparent Cost-Splitting Formula & Economic Rationale\n\n"
        "#### 1. Pooled Truck Total Cost ($C_{\\text{truck}}$)\n"
        "$$C_{\\text{truck}} = F_{\\text{truck}} + (R_{\\text{km}} \\times D_{\\text{total}})$$\n"
        f"- Fixed Base Hire ($F_{{\\text{{truck}}}}$): ₹{float(d_base):,.2f}\n"
        f"- Per-km Rate ($R_{{\\text{{km}}}}$): ₹{float(d_rate):,.2f}/km\n"
        f"- Total Trip Distance ($D_{{\\text{{total}}}}$): {float(d_dist):.1f} km\n"
        f"- **Calculated Pooled Cost**: ₹{float(total_truck_cost):,.2f}\n\n"
    )

    if split_method == "ton_km":
        formula_md += (
            "#### 2. Ton-Kilometer Proportional Share\n"
            "$$\\text{Ton-Km}_i = W_i \\times D_i, \\quad "
            "\\text{Share}_i = \\frac{\\text{Ton-Km}_i}{\\sum \\text{Ton-Km}} \\times C_{\\text{truck}}$$\n"
            "- Weights both the cargo volume and the travel distance for fair multi-village pickups.\n\n"
        )
    else:
        formula_md += (
            "#### 2. Weight-Share Proportional Allocation\n"
            "$$\\text{Share}_i = \\frac{W_i}{W_{\\text{total}}} \\times C_{\\text{truck}}$$\n"
            "- Total pooled weight $W_{\\text{total}} = \\sum W_i$.\n"
            "- Each farmer pays strictly in proportion to their harvested quintals.\n\n"
        )

    formula_md += (
        "#### 3. Solo Trip Alternative Benchmark ($C_{\\text{solo}, i}$)\n"
        "$$C_{\\text{solo}, i} = F_{\\text{tempo}} + (R_{\\text{tempo}} \\times D_i)$$\n"
        f"- Solo Small Commercial Vehicle Base: ₹{float(d_solo_base):,.2f}\n"
        f"- Solo per-km Rate: ₹{float(d_solo_rate):,.2f}/km\n\n"
        "#### 4. Individual Farmer Savings\n"
        "$$\\text{Savings}_i = C_{\\text{solo}, i} - C_i, \\quad "
        "\\text{Savings \\%}_i = \\frac{\\text{Savings}_i}{C_{\\text{solo}, i}} \\times 100\\%$$\n"
    )

    # 4. Standard Illustrated Example for Farmers (with savings computed from inputs)
    computed_collective_savings = (
        f"₹{_round_currency(total_savings):,.2f} saved collectively ({_round_pct(total_savings_pct)}% freight reduction)"
    )

    example_breakdown = {
        "title": "Example: 3 Farmers Pooling 50 Quintals Cotton to Enumamula Mandi (30 km)",
        "truck_details": {
            "capacity": "10-Tonne Eicher Truck",
            "base_cost": 3000.0,
            "rate_per_km": 35.0,
            "distance_km": 30.0,
            "total_pooled_cost": 4050.0,
        },
        "solo_alternative": {
            "vehicle": "Individual 1.5-Tonne Small Tempo",
            "base_cost": 1200.0,
            "rate_per_km": 25.0,
            "cost_per_farmer_approx": 1950.0,
            "total_solo_cost_3_farmers": 5850.0,
        },
        "farmers": [
            {
                "farmer": "Ramesh (Demo Farmer)",
                "weight_quintals": 25.0,
                "share_pct": 50.0,
                "pooled_cost": 2025.0,
                "solo_cost": 1950.0,
                "net_note": "Carries 25 quintals (would have required 2 solo tempo trips at ₹3,900, saving ₹1,875)",
            },
            {
                "farmer": "Mallesh (Neighbor)",
                "weight_quintals": 15.0,
                "share_pct": 30.0,
                "pooled_cost": 1215.0,
                "solo_cost": 1950.0,
                "net_savings": 735.0,
                "savings_pct": 37.7,
            },
            {
                "farmer": "Kavitha (Neighbor)",
                "weight_quintals": 10.0,
                "share_pct": 20.0,
                "pooled_cost": 810.0,
                "solo_cost": 1950.0,
                "net_savings": 1140.0,
                "savings_pct": 58.5,
            },
        ],
        "collective_savings": computed_collective_savings,
    }

    notes = [
        "Transparent arithmetic: exact weight share prevents cross-subsidies between large and marginal farmers.",
        "Solo benchmark models hiring a standalone small commercial vehicle / tempo.",
        "Cost-splitting does not require online payments; settlement is conducted between participating farmers or with the truck operator.",
    ]

    return CostSplitResult(
        split_method=split_method,
        total_truck_cost=_round_currency(total_truck_cost),
        total_solo_cost=_round_currency(total_solo_sum),
        total_savings=_round_currency(total_savings),
        total_savings_percentage=_round_pct(total_savings_pct),
        formula_breakdown=formula_md,
        example_breakdown=example_breakdown,
        participants=splits,
        notes=notes,
    )

