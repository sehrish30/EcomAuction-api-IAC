import { CfnOutput, CfnParameter } from "aws-cdk-lib";
import { Construct } from "constructs";

export class EcomAuctionCloudformationParameters extends Construct {
  public readonly adminsPhoneParam: string;
  public readonly adminsEmailParam: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const adminsPhoneParam = new CfnParameter(this, "AdminsPhone", {
      type: "String",
      description: "Admin Phone number",
      default: "+973*********",
    });
    this.adminsPhoneParam = adminsPhoneParam.valueAsString;

    const adminsPhoneEmail = new CfnParameter(this, "AdminsEmail", {
      type: "String",
      description: "Admin Phone Email",
      default: "sehrishwaheed98@gmail.com",
    });
    this.adminsEmailParam = adminsPhoneEmail.valueAsString;
    // Export the value of the parameter
    new CfnOutput(this, "AdminsPhoneOutput", {
      value: adminsPhoneParam.valueAsString,
      exportName: "AdminsPhoneExport", // Fn.importValue("AdminsPhoneExport") in other stacks
    });

    const databasePort = new CfnParameter(this, "databasePort", {
      type: "Number",
      description: "The database port to open for ingress connections",
      minValue: 1,
      maxValue: 10000,
      default: 5432,
      allowedValues: ["8000", "3000", "5000", "5432"],
    });

    console.log("database port 👉", databasePort.valueAsString);

    // 👇 parameter of type String
    // const tableName = new CfnParameter(this, "tableName", {
    //   type: "String",
    //   description: "The name of the Dynamodb table",
    // });
    // // console.log("tableName 👉 ", tableName.valueAsString);

    // // 👇 parameter of type CommaDelimitedList
    // const favoriteRegions = new CfnParameter(this, "favoriteRegions", {
    //   type: "CommaDelimitedList",
    //   description: "An array of regions",
    // });
    // console.log("favoriteRegions 👉 ", favoriteRegions.valueAsList);
  }
}
