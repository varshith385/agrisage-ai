import indiaData from '../data/india_districts.json';
import subdistrictsData from '../data/subdistricts_villages.json';

export interface DistrictInfo {
  name: string;
  latitude: number;
  longitude: number;
  is_fallback: boolean;
  te?: string;
  hi?: string;
}

export interface VillageInfo {
  village: string;
  latitude: number;
  longitude: number;
  precision: 'village' | 'approximate district centre';
  is_district_centre: boolean;
  type?: 'district_centre' | 'mandal' | 'sample_village';
}

export interface StateInfo {
  state: string;
  latitude: number;
  longitude: number;
  district_count: number;
  districts: DistrictInfo[];
}

export const getIndianStates = (): StateInfo[] => {
  return indiaData.states as StateInfo[];
};

export const getDistrictsForState = (stateName: string): DistrictInfo[] => {
  const foundState = (indiaData.states as StateInfo[]).find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  return foundState ? foundState.districts : [];
};

export const getDistrictCoordinates = (
  stateName: string,
  districtName: string
): { latitude: number; longitude: number; isFallback: boolean } => {
  const foundState = (indiaData.states as StateInfo[]).find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  if (!foundState) {
    return { latitude: 17.8749, longitude: 78.1008, isFallback: true };
  }

  const foundDistrict = foundState.districts.find(
    (d) => d.name.toLowerCase() === districtName.toLowerCase()
  );

  if (foundDistrict) {
    return {
      latitude: foundDistrict.latitude,
      longitude: foundDistrict.longitude,
      isFallback: Boolean(foundDistrict.is_fallback),
    };
  }

  return {
    latitude: foundState.latitude,
    longitude: foundState.longitude,
    isFallback: true,
  };
};

export const getVillagesForDistrict = (stateName: string, districtName: string): VillageInfo[] => {
  const coords = getDistrictCoordinates(stateName, districtName);
  const distCentre: VillageInfo = {
    village: 'District Centre',
    latitude: coords.latitude,
    longitude: coords.longitude,
    precision: 'approximate district centre',
    is_district_centre: true,
    type: 'district_centre',
  };

  // For Andhra Pradesh: All 26 districts changed boundaries during the April 2022 reorganization.
  // None of the 13 Census 2011 districts remained unsplit.
  // Modern districts fall back to verified district headquarters centroids.
  if (stateName.toLowerCase() === 'andhra pradesh' && !districtName.includes('(pre-2022 district)')) {
    return [distCentre];
  }

  const stData = (subdistrictsData.states as Record<string, Record<string, Array<{ name: string; latitude: number; longitude: number; type?: string }>>>)[stateName];
  if (!stData) {
    return [distCentre];
  }

  const dKey = Object.keys(stData).find((k) => k.toLowerCase() === districtName.toLowerCase());
  if (!dKey || !stData[dKey] || stData[dKey].length === 0) {
    return [distCentre];
  }

  const mandals: VillageInfo[] = stData[dKey].map((m) => ({
    village: m.name,
    latitude: m.latitude,
    longitude: m.longitude,
    precision: 'village',
    is_district_centre: false,
    type: (m.type as any) || 'mandal',
  }));

  return [distCentre, ...mandals];
};

export const getLocalizedStateName = (stateName: string, lang: string): string => {
  if (stateName === 'Telangana') {
    if (lang === 'te') return 'తెలంగాణ';
    if (lang === 'hi') return 'तेलंगाना';
    return 'Telangana';
  }
  if (stateName === 'Andhra Pradesh') {
    if (lang === 'te') return 'ఆంధ్రప్రదేశ్';
    if (lang === 'hi') return 'आंध्र प्रदेश';
    return 'Andhra Pradesh';
  }
  if (lang !== 'en') {
    return `${stateName} [EN]`;
  }
  return stateName;
};

export const getLocalizedDistrictName = (district: DistrictInfo, lang: string): string => {
  if (lang === 'te' && district.te) {
    return district.te;
  }
  if (lang === 'hi' && district.hi) {
    return district.hi;
  }
  if (lang !== 'en' && !district.te && !district.hi) {
    return `${district.name} [EN]`;
  }
  return district.name;
};
