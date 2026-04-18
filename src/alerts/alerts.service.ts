import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionDto } from './dto/query-subscription.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { AlertSubscription, Alert } from './types';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<AlertSubscription> {
    return this.prisma.alertSubscription.create({
      data: dto,
    });
  }

  async getSubscriptions(
    query: QuerySubscriptionDto,
  ): Promise<AlertSubscription[]> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    return this.prisma.alertSubscription.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlerts(query: QueryAlertDto): Promise<Alert[]> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    return this.prisma.alert.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateAlertsForIncident(incidentId: number): Promise<void> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident || incident.status !== 'verified') {
      return;
    }

    const subscriptions = await this.prisma.alertSubscription.findMany();

    const matchingSubscriptions = subscriptions.filter((sub) => {
      const distance = this.calculateHaversineDistance(
        incident.latitude,
        incident.longitude,
        sub.latitude,
        sub.longitude,
      );

      const withinRadius = distance <= sub.radius;
      const categoryMatch = !sub.category || sub.category === incident.type;

      return withinRadius && categoryMatch;
    });

    for (const sub of matchingSubscriptions) {
      // Check for existing alert to prevent duplicates
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          incidentId,
          subscriptionId: sub.id,
        },
      });

      if (!existingAlert) {
        await this.prisma.alert.create({
          data: {
            incidentId,
            subscriptionId: sub.id,
          },
        });
      }
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
