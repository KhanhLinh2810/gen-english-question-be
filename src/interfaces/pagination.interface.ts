export interface IPagination {
  limit: number;
  offset: number;
  sort: 'asc' | 'desc';
  order_by: string;
}
