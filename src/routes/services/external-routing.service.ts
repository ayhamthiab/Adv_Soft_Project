import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalRoutingService {
  async getRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error('External routing request failed');
    }

    const data = (await response.json()) as { routes?: Array<{ distance: number; duration: number }> } | undefined;

    if (!data || !Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error('Invalid external route response');
    }

    const route = data.routes[0];
    return {
      distance: Number((route.distance / 1000).toFixed(2)),
      duration: Number((route.duration / 60).toFixed(0)),
    };
  }
}
