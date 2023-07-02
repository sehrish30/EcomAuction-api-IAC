import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EcomAuctionIAMRole } from "../iam-role";

import {
  createDataSource,
  createLambda,
  createLambdaResolver,
} from "./appsync-utils";

interface EcomAuctionUpdateUserAccountProps {
  babySitterTable: Table;
  graphqlApi: CfnGraphQLApi;
  iamRole: EcomAuctionIAMRole;
  apiSchema: CfnGraphQLSchema;
}

export class EcomAuctionUpdateserAccount extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionUpdateUserAccountProps
  ) {
    super(scope, id);

    const { graphqlApi, babySitterTable, iamRole, apiSchema } = props;

    const lambda = createLambda(
      this,
      "updateUserAccount.ts",
      "updateUserAccountLambda",
      "../lambda_fns/users",
      babySitterTable
    );

    const lambdaDataSources = createDataSource(
      this,
      graphqlApi,
      lambda,
      iamRole.appsyncLambdaRole,
      "UpdateUserDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const resolver = createLambdaResolver(
      this,
      graphqlApi,
      apiSchema,
      "updateUser",
      lambdaDataSources, // points to our dataSource
      "Mutation"
    );
  }
}
