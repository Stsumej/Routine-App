import { DEFAULT_SUNSET_HOUR } from './tokens';

export interface GeoCoords {
  lat: number;
  lon: number;
}

/**
 * Standard NOAA/Sunrise-Sunset solar equation. Returns sunset in UTC decimal hours
 * for the given calendar date + coordinates, or null if the sun never sets that day
 * (polar regions in summer/winter).
 */
export function calcSunsetUTC(date: Date, lat: number, lon: number): number | null {
  const rad = Math.PI / 180;
  const start = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const zenith = 90.833;

  const lngHour = lon / 15;
  const t = dayOfYear + (18 - lngHour) / 24;

  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(rad * M) + 0.02 * Math.sin(2 * rad * M) + 282.634;
  L = (L + 360) % 360;

  let RA = (1 / rad) * Math.atan(0.91764 * Math.tan(rad * L));
  RA = (RA + 360) % 360;
  const Lq = Math.floor(L / 90) * 90;
  const RAq = Math.floor(RA / 90) * 90;
  RA = (RA + (Lq - RAq)) / 15;

  const sinDec = 0.39782 * Math.sin(rad * L);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(rad * zenith) - sinDec * Math.sin(rad * lat)) / (cosDec * Math.cos(rad * lat));
  if (cosH > 1 || cosH < -1) return null; // sun never sets/rises today at this latitude

  const H = (1 / rad) * Math.acos(cosH);
  const Tt = H / 15 + RA - 0.06571 * t - 6.622;
  const UT = Tt - lngHour;
  return (UT + 24) % 24;
}

// Convert a computed (or fallback) sunset time to local decimal hours for `now`'s timezone offset.
export function getSunsetLocalHour(now: Date, geo: GeoCoords | null): number {
  if (geo) {
    const utc = calcSunsetUTC(now, geo.lat, geo.lon);
    if (utc != null) return (utc - now.getTimezoneOffset() / 60 + 24) % 24;
  }
  return DEFAULT_SUNSET_HOUR;
}
