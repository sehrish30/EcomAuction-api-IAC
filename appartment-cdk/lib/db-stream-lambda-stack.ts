import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodeSigningConfig,
  FilterCriteria,
  FilterRule,
  Runtime,
  StartingPosition,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import {
  DynamoEventSource,
  SqsDlq,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Platform, SigningProfile } from "aws-cdk-lib/aws-signer";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Subscription, SubscriptionProtocol, Topic } from "aws-cdk-lib/aws-sns";

interface DdbStreamLamdaStackProps extends StackProps {
  acmsDatabase: Table;
}

export class DdbStreamLamdaStack extends Stack {
  constructor(scope: Construct, id: string, props: DdbStreamLamdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase } = props;

    const signingProfile = new SigningProfile(this, "SigningProfile", {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new CodeSigningConfig(this, "CodeSigningConfig", {
      signingProfiles: [signingProfile],
    });

    /**
     * read dynamodb stream
     */
    const readDDBStreamLambda: NodejsFunction = new NodejsFunction(
      this,
      "ReadDDBStreamHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: Runtime.NODEJS_18_X,
        handler: "handler",
        entry: join(__dirname, "lambda-fns/ddbstream", "app.ts"),

        memorySize: 1024,
      }
    );

    const deadLetterQueue = new Queue(this, "DeadLetterQueueDDB");

    //Adds a DynamoDB event source to the Lambda function to read the DynamoDB stream.
    readDDBStreamLambda.addEventSource(
      new DynamoEventSource(acmsDatabase, {
        // Start reading at the last untrimmed record in the shard in the system, which is the oldest data record in the shard.
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        bisectBatchOnError: true,
        onFailure: new SqsDlq(deadLetterQueue),
        retryAttempts: 10,
        filters: [
          FilterCriteria.filter({
            eventName: FilterRule.isEqual("INSERT"),
            dynamodb: {
              // others are like BOOKING, APARTMENT i am ignoring those images
              // check the event from the function to see what you want to filter
              NewImage: { ENTITY: { S: FilterRule.isEqual("BUILDING") } },
            },
          }),
        ],
      })
    );

    readDDBStreamLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    acmsDatabase.grantFullAccess(readDDBStreamLambda);
    readDDBStreamLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);

    // SNS
    const AdminTopic = new Topic(this, "ADMIN");

    AdminTopic.grantPublish(readDDBStreamLambda);

    // Add an email subscription to the topic
    const adminEmail = "sehrishwaheed98@gmail.com";
    const subscription = new Subscription(this, "AdminSubscription", {
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: adminEmail,
      topic: AdminTopic,
    });

    readDDBStreamLambda.addEnvironment("TopicArn", AdminTopic.topicArn);
  }
}
