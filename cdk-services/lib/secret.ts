import { RemovalPolicy, SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

import 'dotenv/config'

interface EcomAuctionApiSecretProps {}

export class EcomAuctionSecret extends Construct {
  public readonly googleClientSecretValue: SecretValue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.googleClientSecretValue = this.createGoogleClientSecretValue();
  }

  private createGoogleClientSecretValue(): SecretValue {
    // Templated secret with username and password fields
    const googleSecret = new Secret(this, "googleClientSecretValue", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          googleClientValue: process.env.GOOGLE_SECRET!,
        }),
        generateStringKey: "google_secret_key",
        includeSpace: false,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    return Secret.fromSecretAttributes(this, "GoogleClientSecret", {
      secretCompleteArn: googleSecret.secretArn,
    }).secretValue;
  }
}
