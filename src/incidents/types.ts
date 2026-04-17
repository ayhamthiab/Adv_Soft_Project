import { Incident } from '@prisma/client';

export interface FindAllResponse {
  data: Incident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}