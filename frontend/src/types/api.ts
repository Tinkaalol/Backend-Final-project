export interface Paginated<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}
