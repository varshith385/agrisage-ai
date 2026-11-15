"""
Grow2Gain — Round 7f Tests: Andhra Pradesh & Telangana Hierarchy Verification
"""
import pytest
from backend.app.services.location_data import get_districts, get_villages, get_states


def test_andhra_pradesh_all_26_districts_fall_back_to_district_centre():
    """
    Round 7f Test: Verifies that every one of the 26 modern post-2022 Andhra Pradesh districts
    falls back to 'District Centre' with precision 'approximate district centre',
    because all 13 Census 2011 districts were bifurcated or trifurcated in April 2022.
    """
    ap_districts = get_districts("Andhra Pradesh")
    assert len(ap_districts) == 26

    for dist in ap_districts:
        villages = get_villages("Andhra Pradesh", dist)
        assert len(villages) == 1, f"District {dist} returned unexpected subdistricts: {villages}"
        dc = villages[0]
        assert dc["village"] == "District Centre"
        assert dc["precision"] == "approximate district centre"
        assert dc["is_district_centre"] is True


def test_andhra_pradesh_pre_2022_reference_labels():
    """
    Round 7f Test: Verifies that historical Census 2011 mandals are kept only under
    explicit '(pre-2022 district)' keys and never conflated with post-2022 district names.
    """
    from backend.app.services.location_data import _VILLAGE_CACHE, _load_data

    _load_data()
    assert _VILLAGE_CACHE is not None
    ap_cache = _VILLAGE_CACHE.get("Andhra Pradesh", {})

    for key in ap_cache.keys():
        assert "(pre-2022 district)" in key, f"Key '{key}' is missing '(pre-2022 district)' label"


def test_telangana_warangal_mandals_and_sample_villages_reconciled():
    """
    Round 7f Test: Verifies that Warangal returns 1 District Centre, 11 mandals,
    and 5 sample villages (total 17 items in dropdown/API), with consistent source of truth.
    """
    villages = get_villages("Telangana", "Warangal")
    assert len(villages) == 17

    district_centre = [v for v in villages if v.get("is_district_centre")]
    assert len(district_centre) == 1
    assert district_centre[0]["precision"] == "approximate district centre"

    mandals = [v for v in villages if v.get("type") == "mandal"]
    assert len(mandals) == 11
    assert "Narsampet" in [m["village"] for m in mandals]
    assert "Geesugonda" in [m["village"] for m in mandals]

    sample_villages = [v for v in villages if v.get("type") == "sample_village"]
    assert len(sample_villages) == 5
    sample_names = {s["village"] for s in sample_villages}
    assert sample_names == {"Geikonda", "Dharmasagar", "Atmakur", "Wardhannapet", "Parkal"}
