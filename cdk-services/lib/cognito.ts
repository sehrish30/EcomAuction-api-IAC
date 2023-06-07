import {
  OAuthScope,
  UserPool,
  UserPoolEmail,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {}

export class EcomAuctionApiCognito extends Construct {
  public readonly userPoolArn: string;
  public readonly userPool: UserPool;
  public readonly UserPoolClientId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // pool contains users information: email, phone, name
    // database of users
    const userpool = new UserPool(this, "myuserpool", {
      userPoolName: "cdk-service-cognito",
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Verify your email for our awesome app!",
        emailBody:
          "Thanks for signing up to our awesome app! Your verification code is {####}",
        emailStyle: VerificationEmailStyle.CODE,
        smsMessage:
          "Thanks for signing up to our awesome app! Your verification code is {####}",
      },
      autoVerify: {
        email: true,
      },
      email: UserPoolEmail.withCognito(), // withSES for prod app
      //   UserPoolEmail.withSES({
      //     fromEmail: 'noreply@myawesomeapp.com',
      //     fromName: 'Awesome App',
      //     replyTo: 'support@myawesomeapp.com',
      //   })
    });

    this.userPool = userpool;
    this.userPoolArn = userpool.userPoolArn;

    // we can add custom domain as well
    userpool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: "ecom-auction-app",
      },
    });

    // app clients, clients going to use our congito authentication
    const client = userpool.addClient("Client", {
      generateSecret: false, // when we want to have server to server communication
      userPoolClientName: "ecom-auction-client",
      //   authFlows: {
      //     userPassword: true,
      //   },
      oAuth: {
        flows: {
          // jwt token will be returned back to client
          // and not be hidden or use back channel for this
          implicitCodeGrant: true,
        },
        callbackUrls: ["http://localhost:3000/callback"],
        // scopes as part of jwt token
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
      },
    });
    this.UserPoolClientId = client.userPoolClientId;
  }
}
