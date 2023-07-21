import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcomAuctionAppSync } from "./appsync";
import { EcomAuctionApplyToJob } from "./appsync/applyToJob";
import { EcomAuctionCreateJob } from "./appsync/createJob";
import { EcomAuctionCreateUserAccount } from "./appsync/createUserAccount";
import { EcomAuctionGetUserAccount } from "./appsync/getUser";
import { EcomAuctionListAllJobs } from "./appsync/listAllJobs";
import { EcomAuctionUpdateserAccount } from "./appsync/updateUserAccount";
import { EcomAuctionCloudWatch } from "./cloud-watch";
import { EcomAuctionNannyJobCognito } from "./cognito";
import { EcomAuctionCognito } from "./cognito-iam";
import { EcomAuctionDynamoDB } from "./dynamodb";
import { EcomAuctionIAMRole } from "./iam-role";
import { EcomAuctionStepFunctions } from "./step-functions";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkNannyJobsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudwatch = new EcomAuctionCloudWatch(this, "Cloudwatch");

    const iamRole = new EcomAuctionIAMRole(this, "iamRole");
    const cognito = new EcomAuctionNannyJobCognito(this, "Cognito", {});
    const appsync = new EcomAuctionAppSync(this, "AppSync", {
      userPool: cognito.userPool,
      cloudWatchRole: cloudwatch.cloudWatchRole,
      region: this.region,
    });

    const dynamodb = new EcomAuctionDynamoDB(this, "DynamoDB");
    const cognitoIAM = new EcomAuctionCognito(this, "CognitoIAM", {
      userPool: cognito.userPool,
    });

    const createUserAccount = new EcomAuctionCreateUserAccount(
      this,
      "CreateUser",
      {
        babySitterTable: dynamodb.babySitterTable,
        graphqlApi: appsync.graphqlApi,
        iamRole: iamRole,
        apiSchema: appsync.apiSchema,
        userPoolId: cognito.userPool.userPoolId,
        cognitoPolicy: cognitoIAM.cognitoPolicy,
      }
    );

    const updateUserAccount = new EcomAuctionUpdateserAccount(
      this,
      "UpdateUser",
      {
        babySitterTable: dynamodb.babySitterTable,
        graphqlApi: appsync.graphqlApi,
        iamRole: iamRole,
        apiSchema: appsync.apiSchema,
      }
    );

    const getUserAccount = new EcomAuctionGetUserAccount(this, "GetUser", {
      babySitterTable: dynamodb.babySitterTable,
      graphqlApi: appsync.graphqlApi,
      iamRole: iamRole,
      apiSchema: appsync.apiSchema,
    });

    const createJob = new EcomAuctionCreateJob(this, "CreateJob", {
      babySitterTable: dynamodb.babySitterTable,
      graphqlApi: appsync.graphqlApi,
      iamRole: iamRole,
      apiSchema: appsync.apiSchema,
    });

    const listJobs = new EcomAuctionListAllJobs(this, "listJobs", {
      babySitterTable: dynamodb.babySitterTable,
      graphqlApi: appsync.graphqlApi,
      iamRole: iamRole,
      apiSchema: appsync.apiSchema,
    });

    const applytoJobs = new EcomAuctionApplyToJob(this, "applytoJobs", {
      babySitterTable: dynamodb.babySitterTable,
      graphqlApi: appsync.graphqlApi,
      iamRole: iamRole,
      apiSchema: appsync.apiSchema,
    });

    const stepfunctions = new EcomAuctionStepFunctions(this, "stepFunctions", {
      babySitterTable: dynamodb.babySitterTable,
    });
  }
}

/**
 * To create codegen
 * 1) Create a file in the root directory of your project called codegen.yml and paste there link to ur schema
 * 2) This tells graphql-codegen which schema file(s) it should use (in the example: schema.graphql), what plugin (typescript) and where the output should be placed (appsync.d.ts).
 * 3) Since we are using AWS Appsync to build out the GraphQL API, we'll be making use of AWS Appsync Scalars which aren't available in the default GraphQL Language.
 * 4) Create another file in your project's root directory called appsync.graphql and add these scalars to it.
 * 5) need to tell graphql-codegen how to map these scalars to TypeScript.
 * 6) add config: scalars in codegen.yml
 * 7) add this "- appsync.graphql" to schema
 */

/**
 * Get all applications for a job with a Dynamodb Query and GSI(Global Secondary Index).
  Update Job Status from OPEN to CLOSED and application status for accepted an applicant from PENDING to ACCEPTED.
  Put the rest of the job applications into an SQS queue, which would then be polled by another lambda function and update the job application status from PENDING to DECLINED asynchronously.
 */

/**
   * Booking a nanny
   * Getting all applications for the job in particular.
    accepting one of the job application(changing application status to ACCEPTED),
    declining all other job applications(changing application status to DECLINED),
    closing the job, so that it won't be available anymore for applying to(changing job status to CLOSED).
   */
