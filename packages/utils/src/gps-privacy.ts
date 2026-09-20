import { IGpsCoordinate } from '@alpha/types';

/**
 * GPS and Location Privacy Utilities for Wearables and External Health Activities
 */
export const GpsPrivacyUtil = {
  /**
   * Earth mean radius in meters
   */
  EARTH_RADIUS_METERS: 6371000,

  /**
   * Calculate great-circle distance between two geographic coordinates using the Haversine formula
   */
  calculateHaversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_METERS * c;
  },

  /**
   * Check whether a coordinate falls inside a privacy zone
   */
  isPointInZone(
    point: { latitude: number; longitude: number },
    zone: { latitude: number; longitude: number; radiusMeters: number },
  ): boolean {
    const distance = this.calculateHaversineDistanceMeters(
      point.latitude,
      point.longitude,
      zone.latitude,
      zone.longitude,
    );
    return distance <= zone.radiusMeters;
  },

  /**
   * Filter out any coordinates that fall within any of the user's defined privacy zones
   */
  filterPrivacyZones(
    coordinates: IGpsCoordinate[],
    zones: Array<{ latitude: number; longitude: number; radiusMeters: number }>,
  ): IGpsCoordinate[] {
    if (!zones || zones.length === 0 || !coordinates || coordinates.length === 0) {
      return coordinates || [];
    }

    return coordinates.filter((point) => {
      for (const zone of zones) {
        if (this.isPointInZone(point, zone)) {
          return false; // redact/strip coordinate inside privacy zone
        }
      }
      return true;
    });
  },

  /**
   * Trim start and end endpoints of a route by a specified radius in meters
   * to protect user starting point (e.g. home) and destination.
   */
  trimEndpoints(
    coordinates: IGpsCoordinate[],
    trimMeters: number,
  ): IGpsCoordinate[] {
    if (!coordinates || coordinates.length <= 2 || trimMeters <= 0) {
      return coordinates || [];
    }

    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];
    if (!startPoint || !endPoint) {
      return coordinates;
    }

    // Find the first index outside startPoint's trim radius
    let startIndex = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const current = coordinates[i];
      if (!current) continue;
      const dist = this.calculateHaversineDistanceMeters(
        startPoint.latitude,
        startPoint.longitude,
        current.latitude,
        current.longitude,
      );
      if (dist > trimMeters) {
        startIndex = i;
        break;
      }
    }

    // Find the last index outside endPoint's trim radius
    let endIndex = coordinates.length - 1;
    for (let i = coordinates.length - 1; i >= startIndex; i--) {
      const current = coordinates[i];
      if (!current) continue;
      const dist = this.calculateHaversineDistanceMeters(
        endPoint.latitude,
        endPoint.longitude,
        current.latitude,
        current.longitude,
      );
      if (dist > trimMeters) {
        endIndex = i;
        break;
      }
    }

    if (startIndex >= endIndex) {
      return [];
    }

    return coordinates.slice(startIndex, endIndex + 1);
  },

  /**
   * Sanitize or redact route coordinates when viewed by a coach or third-party organization
   * if the athlete has not explicitly permitted GPS route sharing.
   */
  applyCoachRouteRedaction(
    coordinates: IGpsCoordinate[],
    shareGpsRouteWithCoach: boolean,
  ): IGpsCoordinate[] {
    if (!shareGpsRouteWithCoach) {
      return []; // Completely strip GPS points for privacy
    }
    return coordinates;
  },
};
