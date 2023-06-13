'use strict';

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Event, SQSEvent } from 'aws-lambda';

const client = new SESClient({
  // AWS region to which this client will send requests
  region: "us-east-2",
  maxAttempts: 2,
});

const sendMail= async(event: SQSEvent)=> {
  // get records of sqs batch in the event object
  // single and only message that we are going to process
  const record = event.Records[0];
  console.log("record processing", record);

  // you can only send strings in SQS
  // so we need to parse them to work with javascript object
  const email = JSON.parse(record.body);
  
  const { subject, body, recipient } = email;
  /**
   * You will get values coming from sqs
   * will get records of sqs batch in event object
   * Our notification service will pick up message from queue and send them
   * and then incorporate this in our auctions
   */
  const input = {
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        // Html: {
        //   Charset: "UTF-8",
        //   Data: "Hello notified",
        // },
        Text: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: process.env.SES_SENDER_EMAIL,
  };

  const command = new SendEmailCommand(input);
  try {
    const response = await client.send(command);
    return response;
  } catch (err) {
    console.log(err);
  }
  return event;
}

export const handler = sendMail;

// serverless deploy function --function sendMail
// serverless invoke -f sendMail -l
// serverless logs -f sendMail --startTime 1h
// serverless logs -f sendMail -t



/**
 * SQS beneifts
 * security: Granualr control over who can send and receive messages. messages can be encrypted
 * Durability: Amazon SQS stores messages on multiple servers
 * Availablity: Highly concurrent access to messages and high availability for message production/consumption
 * Scalability: SQS autoscales to handle any load increase or spike without any instruction
 * Reliability: Messages can be sent by multiple producers and multiple consumers at the same time
 * Customization: Can set default delays, variable message sizes, message splitting etc
 *
 * Two types of Queue
 * Standard Queue: maximum throughput, nearly unlimited transactions per second
 * Atleast once delivery: Should design services to handle the case, where the  same message is delivered more than once
 * Best-effort ordering: SQS will do its best to deliver you the message in order they are sent but not guaranteed
 *
 * Standard queue:
 * Offers maximum throughput
 * Al least once delivery
 * Best effot ordering
 *
 * FIFO QUEUE:
 * First in first out: (guaranteed order)
 * Messages processed exactly once
 * Limited throughput (3000 messages per second with batching or upto 300 messages per second without batching) you can batch upto 10 messages at a time
 *
 * Dead Letter Queue:
 * also just Standard SQS Queue but with different purpose
 * Configured can be for normal queue to send dead letters or
 * for Messages that failed processing
 * isolate problametic messages that couldn't be processed for whatever reason
 * and then you can either process them later
 * or have manual human intervention to understand what went wrong
 *
 * SQS pricing
 * Pay based on your usage No minimum fee
 * First 1 million monthly requests are free
 *
 * FIFO Queue:
 * $0.5 per 1 million requests
 *
 * Sandard Queue:
 * $0.4 per 1 million requests
 */

