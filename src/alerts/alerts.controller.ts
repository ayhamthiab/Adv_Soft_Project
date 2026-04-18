import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionDto } from './dto/query-subscription.dto';
import { QueryAlertDto } from './dto/query-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('subscriptions')
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.alertsService.createSubscription(dto);
  }

  @Get('subscriptions')
  async getSubscriptions(@Query() query: QuerySubscriptionDto) {
    return this.alertsService.getSubscriptions(query);
  }

  @Get()
  async getAlerts(@Query() query: QueryAlertDto) {
    return this.alertsService.getAlerts(query);
  }
}
