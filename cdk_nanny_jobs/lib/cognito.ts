import { RemovalPolicy } from "aws-cdk-lib";
import {
  AccountRecovery,
  CfnUserPoolGroup,
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface EcomAuctionNannyJobCognitoProps {}

export class EcomAuctionNannyJobCognito extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionNannyJobCognitoProps
  ) {
    super(scope, id);

    const userPool = new UserPool(this, "NannyJobCognitoUserPool", {
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.PHONE_AND_EMAIL,
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: RemovalPolicy.DESTROY, // remove it when cdk destroy
    });

    // we can add custom domain as well
    userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: "ecom-auction-app",
      },
    });

    this.userPool = userPool;

    this.userPoolClient = new UserPoolClient(
      this,
      "NannyJobCognitoUserPoolClient",
      {
        userPool,
        // userPoolClientName: "babysitter_api",
        generateSecret: false, // when we want to have server to server communication
        // authFlows: {
        //   userSrp: true, // client will use the SRP protocol for user authentication.
        // },
        oAuth: {
          flows: {
            // jwt token will be returned back to client
            // and not be hidden or use back channel for this
            implicitCodeGrant: true,
          },
          callbackUrls: ["http://localhost:3000/callback"],
        },
      }
    );

    new CfnUserPoolGroup(this, "Nanny", {
      userPoolId: userPool.userPoolId,

      groupName: "nanny",
      precedence: 123,
    });
    new CfnUserPoolGroup(this, "Admin", {
      userPoolId: userPool.userPoolId,
      groupName: "admin",
      precedence: 1,
    });
    new CfnUserPoolGroup(this, "Parent", {
      userPoolId: userPool.userPoolId,
      groupName: "parent",
      precedence: 1,
    });
  }
}

/**
 * Your users can sign in directly with a username and password, or through a third party such as Facebook, Amazon, Google or Apple.
The two main components of Amazon Cognito are
user pools
identity pools.
User pools are user directories that provide sign-up and sign-in options for your app users.
Identity pools enable you to grant your users access to other AWS services. You can use identity pools and user pools separately or together.
An app is an entity within a user pool that has permission to call unauthenticated API operations.
Unauthenticated API operations are those that do not have an authenticated user. Examples include operations to register, sign in, and handle forgotten passwords.
To call these API operations, you need an app client ID and an optional client secret.
It is your responsibility to secure any app client IDs or secrets so that only authorized client apps can call these unauthenticated operations.
 */
