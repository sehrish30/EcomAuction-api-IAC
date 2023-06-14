import { SNSEvent } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  DescribeMetricFiltersCommand,
  DescribeMetricFiltersCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";

const cloudwatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION,
});
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  maxAttempts: 2,
});

// customize email content
let generateEmailContent = (data, message) => {
  let events = data.events;

  console.log("Events are:", events);
  let logData = "<br/><h2><u>Application Logs</u></h2>";
  for (let i in events) {
    let parsedEvent = JSON.parse(events[i]["message"].split("INFO")[1].trim());
    logData += `<p style='color: red; font-size: 16px;'><b>Status:</b>${parsedEvent.type}</p>`;
    logData += `<p style='font-size: 14px;'><b>Log Stream:</b>${JSON.stringify(
      events[i]["logStreamName"]
    )}</p>`;
    logData += `<p style='font-size: 14px;'><b>App Name:</b>${parsedEvent.app_name}</p>`;
    logData += `<p style='font-size: 14px;'><b>Service:</b>${parsedEvent.service_name}</p>`;
    logData += `<p style='font-size: 14px;'><b>Stage:</b>${parsedEvent.app_stage}</p>`;
    logData += `<p style='font-size: 14px;'><b>Message:</b>${parsedEvent.message}</p>`;
    logData += `<p style='font-size: 14px;'><b>Callstack:</b>${
      parsedEvent.callstack || "N/A"
    }</p>`;
    logData += `<p style='font-size: 14px;'><b>Payload:</b> <code>${JSON.stringify(
      parsedEvent.payload
    )}</code></p><br/>`;
  }

  let date = new Date(message.StateChangeTime);
  let text = `Alarm Name:<b>${
    message.AlarmName
  }</b><br/>Details: <a href="https://my.example.com">Production URL</a><br/>Account ID:${
    message.AWSAccountId
  }<br/>Region:${
    message.Region
  }<br/>Alarm Time:${date.toString()}<br/>${logData}`;
  let subject = `Details for Alarm - ${message.AlarmName} [URGENT]`;

  console.log({
    SESEmail: process.env.SESEmail,
    SESarn: process.env.SESarn,
  });

  let emailContent = {
    Destination: {
      ToAddresses: ["sehrishwaheed98@gmail.com"], // can add many admin emails
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: text,
        },
        Text: {
          Charset: "UTF-8",
          Data: text,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    // sender
    Source: process.env.SESEmail,
    SourceArn: process.env.SESarn,
    Tags: [
      {
        Name: "sender",
        Value: "Sehrish",
      },
    ],
  };

  return emailContent;
};

let getLogsAndSendEmail = async (
  message: any,
  metricFilterData: DescribeMetricFiltersCommandOutput
) => {
  // query exactly the logs during that timestamp
  const timestamp = Date.parse(message.StateChangeTime);
  const offset =
    message.Trigger.Period * message.Trigger.EvaluationPeriods * 1000;

  const metricFilter = metricFilterData.metricFilters?.[0];

  console.log({
    metricFilter,
  });
  const params = {
    logGroupName: metricFilter?.logGroupName,
    filterPattern: metricFilter?.filterPattern
      ? metricFilter.filterPattern
      : "",
    startTime: timestamp - offset,
    endTime: timestamp,
  };
  // retrieve log events from one or more Amazon CloudWatch Logs log groups that match the specified filter pattern.
  const filterCommand = new FilterLogEventsCommand(params);
  try {
    const logEvents = await cloudwatchLogsClient.send(filterCommand);
    console.log(logEvents.events);

    const emailContent = generateEmailContent(logEvents, message);
    const command = new SendEmailCommand(emailContent);
    const response2 = await sesClient.send(command);
    console.log("SES EMAIL", response2);
  } catch (err) {
    console.log(err);
  }
};

const dispatchErrorsSNSTopicSubscription = async (event: SNSEvent) => {
  const message = JSON.parse(event.Records[0].Sns.Message);

  // get more data about this particular metric
  const requestParams = {
    metricName: message.Trigger.MetricName,
    metricNamespace: message.Trigger.Namespace,
  };
  // describeMetricFilters
  //  retrieve the metric filters associated with a specified Amazon CloudWatch Logs log group.
  const command = new DescribeMetricFiltersCommand(requestParams);
  try {
    const cloudWatchInfo = await cloudwatchLogsClient.send(command);
    await getLogsAndSendEmail(message, cloudWatchInfo);
  } catch (err) {
    console.log("Error occured:", err);
  }
};

export const handler = dispatchErrorsSNSTopicSubscription;

/**
 * serverless logs -f dispatchErrorsSNSTopicSubscription
 * serverless deploy function --function dispatchErrorsSNSTopicSubscription
 */
/**
 * This filter get the cloudwatch logs from data sent to SNS using DescribeAlarmsForMetricCommand
 */
