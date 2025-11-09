declare global {
  interface ResponsePattern<T> {
    message: string;
    status: number;
    reasonStatusCode: string;
    data?: T;
  }
}

export {};
