import indiaData from '../data/india_districts.json';

export interface DistrictInfo {
  name: string;
  latitude: number;
  longitude: number;
  is_fallback: boolean;
  te?: string;
  hi?: string;
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
