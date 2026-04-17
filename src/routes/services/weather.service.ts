import { Injectable } from '@nestjs/common';

@Injectable()
export class WeatherService {
  async getWeather(lat: number, lng: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error('Weather request failed');
    }

    const data = (await response.json()) as { current_weather?: { weathercode: number } } | undefined;

    if (!data || !data.current_weather || typeof data.current_weather.weathercode !== 'number') {
      throw new Error('Invalid weather response');
    }

    const weatherCode = data.current_weather.weathercode;
    const condition = this.mapWeatherCode(weatherCode);
    const impact = this.getImpact(condition);

    return { condition, impact };
  }

  private mapWeatherCode(code: number): string {
    if ([95, 96, 99].includes(code)) {
      return 'storm';
    }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return 'rain';
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return 'snow';
    }
    if ([0, 1, 2, 3].includes(code)) {
      return 'clear';
    }
    return 'cloudy';
  }

  private getImpact(condition: string): number {
    if (condition === 'rain') {
      return 5;
    }
    if (condition === 'storm') {
      return 10;
    }
    return 0;
  }
}
