import { RemovalPolicy, SecretValue } from "aws-cdk-lib";
import 'dotenv/config'
import {
  AccountRecovery,
  DateTimeAttribute,
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolEmail,
  UserPoolIdentityProviderFacebook,
  UserPoolIdentityProviderGoogle,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {
  googleClientSecret: SecretValue;
}

export class EcomAuctionApiCognito extends Construct {
  public readonly userPoolArn: string;
  public readonly userPool: UserPool;
  public readonly UserPoolClientId: string;

  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);

    // pool contains users information: email, phone, name
    // database of users
    const userpool = new UserPool(this, "myuserpool", {
      userPoolName: "cdk-service-cognito",
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Verify your email for our ecomauction app!",
        emailBody:
          "Thanks for signing up to our ecomauction app! Your verification code is {####}",
        emailStyle: VerificationEmailStyle.CODE,
        smsMessage:
          "Thanks for signing up to our ecomauction app! Your verification code is {####}",
      },
      autoVerify: {
        email: true, // Makes Cognito to automatically verify given attributes by sending a verification code
      },
      email: UserPoolEmail.withCognito(), // withSES for prod app
      // email: UserPoolEmail.withSES({
      //   fromEmail: "sehrishwaheed98@gmail.com",
      //   fromName: "Ecomauction App",
      //   // replyTo: "support@myawesomeapp.com",
      // }),
      signInAliases: {
        email: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY, // remove it when cdk destroy
      customAttributes: {
        createdAt: new DateTimeAttribute(),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
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
      authFlows: {
        userPassword: true, // Enable auth using username & password.
      },
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
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.GOOGLE,
        UserPoolClientIdentityProvider.FACEBOOK,
        UserPoolClientIdentityProvider.COGNITO,
      ],
    });
    this.UserPoolClientId = client.userPoolClientId;

    const googleprovider = new UserPoolIdentityProviderGoogle(
      this,
      "Google-EcomAuctionApp",
      {
        clientId: process.env.GOOGLE_APP_ID!,
        // clientSecret: process.env.GOOGLE_SECRET!,
        clientSecretValue: props.googleClientSecret,
        userPool: userpool,
        attributeMapping: {
          email: ProviderAttribute.GOOGLE_EMAIL, // Attribute mapping allows mapping attributes provided by the third-party identity providers
        },
      }
    );

    const facebookProvider = new UserPoolIdentityProviderFacebook(
      this,
      "Facebook-EcomAuctionApp",
      {
        userPool: userpool,
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_SECRET_KEY!,
        attributeMapping: {
          email: ProviderAttribute.FACEBOOK_EMAIL, // Attribute mapping allows mapping attributes provided by the third-party identity providers
        },
      }
    );

    client.node.addDependency(facebookProvider);
    client.node.addDependency(googleprovider);
  }
}
