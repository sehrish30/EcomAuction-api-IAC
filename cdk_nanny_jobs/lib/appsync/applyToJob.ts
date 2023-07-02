import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EcomAuctionIAMRole } from "../iam-role";

import {
  createDataSource,
  createLambda,
  createLambdaResolver,
} from "./appsync-utils";

interface EcomAuctionApplyToJobProps {
  babySitterTable: Table;
  graphqlApi: CfnGraphQLApi;
  iamRole: EcomAuctionIAMRole;
  apiSchema: CfnGraphQLSchema;
}

export class EcomAuctionApplyToJob extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionApplyToJobProps) {
    super(scope, id);

    const { graphqlApi, babySitterTable, iamRole, apiSchema } = props;

    const lambda = createLambda(
      this,
      "applyToJob.ts",
      "applyToJobLambda",
      "../lambda_fns/jobs",
      babySitterTable
    );

    const lambdaDataSource = createDataSource(
      this,
      graphqlApi,
      lambda,
      iamRole.appsyncLambdaRole,
      "ApplyToJobDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const resolver = createLambdaResolver(
      this,
      graphqlApi,
      apiSchema,
      "applyToJob",
      lambdaDataSource, // points to our dataSource
      "Mutation"
    );
  }
}
