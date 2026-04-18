import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRouteDto } from './dto/query-route.dto';
import { ExternalRoutingService } from './services/external-routing.service';
import { WeatherService } from './services/weather.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalRoutingService: ExternalRoutingService,
    private readonly weatherService: WeatherService,
  ) {}

  async estimate(query: QueryRouteDto) {
    const { startLat, startLng, endLat, endLng, avoidCheckpoints = false } = query;

    if (startLat === endLat && startLng === endLng) {
      return {
        distance: 0,
        duration: 0,
        source: 'internal' as const,
        weather: {
          condition: 'none',
          impact: 0,
        },
        factors: {
          checkpoints: 0,
          incidents: 0,
          delays: false,
        },
      };
    }

    const weather = await this.getWeather(startLat, startLng);

    const externalRoute = await this.getExternalRoute(startLat, startLng, endLat, endLng);
    const distance = externalRoute.distance;
    const baseDuration = externalRoute.duration;
    const source = externalRoute.source;

    const relevantIncidents = await this.getRelevantIncidents(startLat, startLng, endLat, endLng);
    const relevantCheckpoints = avoidCheckpoints
      ? []
      : await this.getRelevantCheckpoints(startLat, startLng, endLat, endLng);

    const incidentCount = relevantIncidents.length;
    const checkpointCount = relevantCheckpoints.length;
    const duration = baseDuration + checkpointCount * 5 + incidentCount * 10 + weather.impact;
    const delays = incidentCount > 0 || checkpointCount > 0 || weather.impact > 0;

    return {
      distance: Number(distance.toFixed(2)),
      duration: Number(duration.toFixed(0)),
      source,
      weather,
      factors: {
        checkpoints: checkpointCount,
        incidents: incidentCount,
        delays,
      },
    };
  }

  private async getExternalRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    try {
      return {
        ...(await this.externalRoutingService.getRoute(startLat, startLng, endLat, endLng)),
        source: 'external' as const,
      };
    } catch {
      const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
      return {
        distance,
        duration: distance === 0 ? 0 : (distance / 50) * 60,
        source: 'internal' as const,
      };
    }
  }

  private async getWeather(startLat: number, startLng: number) {
    try {
      return await this.weatherService.getWeather(startLat, startLng);
    } catch {
      return { condition: 'unknown', impact: 0 };
    }
  }

  private async getRelevantCheckpoints(startLat: number, startLng: number, endLat: number, endLng: number) {
    const bounds = this.buildBoundingBox(startLat, startLng, endLat, endLng, 0.05);

    const checkpoints = await this.prisma.checkpoint.findMany({
      where: {
        latitude: {
          gte: bounds.minLat,
          lte: bounds.maxLat,
        },
        longitude: {
          gte: bounds.minLng,
          lte: bounds.maxLng,
        },
      },
    });

    return checkpoints.filter(checkpoint => {
      const distanceToRoute = this.distanceToSegment(
        checkpoint.latitude,
        checkpoint.longitude,
        startLat,
        startLng,
        endLat,
        endLng,
      );
      return distanceToRoute <= 2;
    });
  }

  private async getRelevantIncidents(startLat: number, startLng: number, endLat: number, endLng: number) {
    const bounds = this.buildBoundingBox(startLat, startLng, endLat, endLng, 0.05);

    const incidents = await this.prisma.incident.findMany({
      where: {
        status: 'active',
        latitude: {
          gte: bounds.minLat,
          lte: bounds.maxLat,
        },
        longitude: {
          gte: bounds.minLng,
          lte: bounds.maxLng,
        },
      },
    });

    return incidents.filter(incident => {
      const distanceToRoute = this.distanceToSegment(
        incident.latitude,
        incident.longitude,
        startLat,
        startLng,
        endLat,
        endLng,
      );
      return distanceToRoute <= 2;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (lat1 === lat2 && lon1 === lon2) {
      return 0;
    }

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private buildBoundingBox(lat1: number, lng1: number, lat2: number, lng2: number, margin: number) {
    return {
      minLat: Math.min(lat1, lat2) - margin,
      maxLat: Math.max(lat1, lat2) + margin,
      minLng: Math.min(lng1, lng2) - margin,
      maxLng: Math.max(lng1, lng2) + margin,
    };
  }

  private distanceToSegment(lat: number, lng: number, lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const φ = toRad(lat);
    const λ = toRad(lng);
    const φ1 = toRad(lat1);
    const λ1 = toRad(lng1);
    const φ2 = toRad(lat2);
    const λ2 = toRad(lng2);
    const meanLat = (φ1 + φ2) / 2;

    const x = (λ - λ1) * Math.cos(meanLat);
    const y = φ - φ1;
    const x2 = (λ2 - λ1) * Math.cos(meanLat);
    const y2 = φ2 - φ1;

    const dot = x * x2 + y * y2;
    const len2 = x2 * x2 + y2 * y2;

    if (len2 === 0) {
      return this.calculateDistance(lat, lng, lat1, lng1);
    }

    const t = Math.max(0, Math.min(1, dot / len2));
    const projX = x2 * t;
    const projY = y2 * t;
    const dx = x - projX;
    const dy = y - projY;

    return Math.sqrt(dx * dx + dy * dy) * R;
  }
}
