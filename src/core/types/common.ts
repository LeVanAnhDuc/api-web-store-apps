export interface ISuccessResponse<T> {
  message: string;
  status: number;
  reasonStatusCode: string;
  data?: T;
}
