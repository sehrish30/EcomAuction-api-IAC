declare module "logging" {
  export default function log<T>(event: T): Promise<{
    statusCode: number;
    body: string;
  }>;
}
