import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EcomAuctionIAMRole } from "../iam-role";

import {
  createDataSource,
  createLambda,
  createLambdaResolver,
} from "./appsync-utils";

interface EcomAuctionCreateJobProps {
  babySitterTable: Table;
  graphqlApi: CfnGraphQLApi;
  iamRole: EcomAuctionIAMRole;
  apiSchema: CfnGraphQLSchema;
}

export class EcomAuctionCreateJob extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionCreateJobProps) {
    super(scope, id);

    const { graphqlApi, babySitterTable, iamRole, apiSchema } = props;

    const lambda = createLambda(
      this,
      "createJob.ts",
      "createJobLambda",
      "../lambda_fns/jobs",
      babySitterTable
    );

    const lambdaDataSources = createDataSource(
      this,
      graphqlApi,
      lambda,
      iamRole.appsyncLambdaRole,
      "CreateJobDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const resolver = createLambdaResolver(
      this,
      graphqlApi,
      apiSchema,
      "createJob",
      lambdaDataSources, // points to our dataSource
      "Mutation"
    );
  }
}
