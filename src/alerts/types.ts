export interface AlertSubscription {
  id: number;
  latitude: number;
  longitude: number;
  radius: number;
  category: string | null;
  createdAt: Date;
}

export interface Alert {
  id: number;
  incidentId: number;
  subscriptionId: number;
  createdAt: Date;
}
