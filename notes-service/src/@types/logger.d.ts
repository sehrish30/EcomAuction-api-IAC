declare module "logger" {
  export default function log<T>(event: T): Promise<{
    statusCode: number;
    body: string;
  }>;
}
