const app_name = process.env.APP_NAME as string;
const app_stage = process.env.APP_STAGE!;
const service_name = process.env.SERVICE_NAME!;

interface IPayload {
  service_name: string;
  app_name: string;
  app_stage: string;
}

interface IComingPayload {
  type: string;
  payload: any;
  message?: any;
  callstack?: any;
}

export const log = (payload: IComingPayload) => {
  // as soon as we log it gets logged in aws cloudwatch
  const newPayload: IPayload = {
    app_name,
    app_stage,
    service_name,
    ...payload,
  };
  console.log(JSON.stringify(newPayload));
};
