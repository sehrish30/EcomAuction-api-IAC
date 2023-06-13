import { EventBridgeEvent } from "aws-lambda";

// detail data
interface MyEventPayload {
  name: string;
  age: number;
}

// const myEvent: EventBridgeEvent<string, MyEventPayload> = {
//   version: "0",
//   id: "1234",
//   source: "/my/source",
//   account: "1234567890",
//   time: "2022-02-01T14:30:00Z",
//   region: "us-west-2",
//   resources: [],
//   "detail-type": "",
//   detail: {
//     name: "John Doe",
//     age: 30,
//   },
// };

const verifiedVehicles = (event: EventBridgeEvent<string, MyEventPayload>) => {
  console.log({ event });
  /**
   *  version: '0',
    id: '0f4bacdd-ac7e-2511-1d23-5ae9ab1c6071',
    'detail-type': 'vehicle_verification',
    source: 'vehicle_verification_app',
    account: 'sdsadsd',
    time: '2023-05-21T12:29:58Z',
    region: 'sdsd',
    resources: [],
    detail: { error: false }
   */
  return {
    statusCode: 200,
    result: "RESULT",
  };
};

export const handler = verifiedVehicles;

/**
 * serverless logs -f verifiedVehicles
 * serverless deploy function --function verifiedVehicles
 */
