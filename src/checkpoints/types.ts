export interface CheckpointModel {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'closed' | 'restricted';
  createdAt: string | Date;
}

export interface CheckpointHistoryModel {
  id: number;
  checkpointId: number;
  status: 'open' | 'closed' | 'restricted';
  createdAt: string | Date;
}

export interface FindAllCheckpointsResponse {
  data: CheckpointModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CheckpointHistoryResponse {
  data: CheckpointHistoryModel[];
}