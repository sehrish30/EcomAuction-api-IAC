import { IStepFunction } from "../types";

const validationCheck = async (event: IStepFunction) => {
  if (!event.body.userName) {
    throw new Error("Username is required");
  }
  return {
    status: "ok",
  };
};

export const handler = validationCheck;
//   https://github.com/aws-samples/step-functions-workflows-collection/blob/main/saga-pattern-cdk/lib/stateMachine.ts
//   https://github.com/aws-samples/step-functions-workflows-collection/blob/main/saga-pattern-cdk/lambdas/flights/reserveFlight.ts
//   https://github.com/elthrasher/cdk-step-functions-example/blob/master/src/cdk-step-stack.ts
