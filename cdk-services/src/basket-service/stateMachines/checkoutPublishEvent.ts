import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ebClient } from "../eventBridgeClient";
import { IStepFunction } from "../types";

export const handler = async (event: IStepFunction) => {
  try {
    const input = {
      Entries: [
        {
          Source: process.env.EVENT_SOURCE,
          Resources: [],
          DetailType: process.env.EVENT_DETAIL_TYPE,
          Detail: JSON.stringify(
            event.resultPrepareOrderFunctionResult.Payload.newBasket
          ),
          EventBusName: process.env.EVENT_BUSNAME,
        },
      ],
    };
    await ebClient.send(new PutEventsCommand(input));
  } catch (err) {
    throw err;
  }

  return "Published event to EventBridge";
};
