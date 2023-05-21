import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});

let eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION,
});

const EVENT_BUS_NAME = process.env.EventBusName;
const EVENTSOURCE = process.env.EVENTNAME;
const EVENTNAME = process.env.EVENTSOURCE;

const ddbDocClient = DynamoDBDocumentClient.from(client);

const contactExternalAPI = async (event: SQSEvent) => {
  let records = event.Records;
  const batchItemFailures = [] as { itemIdentifier: string }[];
  if (records?.length) {
    for (const record of records) {
      const parsedBody = JSON.parse(record.body);
      const EXTERNAL_API = "AB45w3";

      // CHECL=K HEARTBEAT IN HEARTBEAT TABLE
      const input = {
        ExpressionAttributeValues: {
          ":ApiId": EXTERNAL_API,
        },
        ExpressionAttributeNames: {
          "#ApiId": "ApiId",
        },
        KeyConditionExpression: "#ApiId = :ApiId",
        TableName: process.env.HEARTBEAT_TABLE_NAME,
      };
      const command = new QueryCommand(input);
      try {
        const response = await ddbDocClient.send(command);
        console.log({ items: response.Items });

        // means external api is down
        if (response.Items) {
          throw new Error("Circuit breaker");
        }
      } catch (err) {
        console.log(err);

        batchItemFailures.push({
          itemIdentifier: record.messageId,
        });
      }

      // before calling external api check if there is any heartbeat issue in dynamo db

      try {
        console.log({ parsedBody: parsedBody.detail });

        //call external api
        if (parsedBody.detail.error) {
          // contacted ecternal api and its down

          // Set the TTL to 5 minutes (in milliseconds)
          const ttl = 5 * 60 * 1000;

          // Get the current Unix timestamp in milliseconds
          const timestamp = new Date().getTime();

          // Calculate the expiration timestamp by adding the TTL to the current timestamp
          const expirationTimestamp = timestamp + ttl;

          const ttlTable = {
            Item: {
              TTL: expirationTimestamp,
              ApiId: EXTERNAL_API,
            },
            TableName: process.env.HEARTBEAT_TABLE_NAME,
          };
          const putCommand = new PutCommand(ttlTable);
          const putResponse = await ddbDocClient.send(putCommand);
          console.log({ putResponse });
        } else {
          // put message to event bridge
          const params = {
            Entries: [
              {
                Source: EVENTSOURCE,
                DetailType: EVENTNAME,
                Detail: JSON.stringify({
                  vehicleDetail: 121,
                }),
                EventBusName: EVENT_BUS_NAME,
              },
            ],
          };
          const command = new PutEventsCommand(params);
          const data = await eventBridgeClient.send(command);
          console.log({ data });
        }
      } catch (err) {
        console.log(err);
        batchItemFailures.push({
          itemIdentifier: record.messageId,
        });
      }
    }
  }
  return batchItemFailures;
};

export const handler = contactExternalAPI;

/**
 * serverless logs -f contactExternalAPI
 * serverless deploy function --function contactExternalAPI
 */
