import { Report } from '@prisma/client';

export interface ReportWithVotes extends Report {
  upvotes: number;
  downvotes: number;
  score: number;
}

export interface FindAllResponse {
  data: ReportWithVotes[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
