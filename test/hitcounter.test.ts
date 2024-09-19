import { Stack } from "aws-cdk-lib";
import { Template, Capture } from "aws-cdk-lib/assertions";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { HitCounter } from "../lib/hitcounter";

test("DynamoDB Table Created", () => {
  const stack = new Stack();
  // WHEN
  new HitCounter(stack, "MyTestConstruct", {
    downstream: new Function(stack, "TestFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "hello.handler",
      code: Code.fromAsset("lambda"),
    }),
  });
  // THEN
  const template = Template.fromStack(stack);
  template.resourceCountIs("AWS::DynamoDB::Table", 1);
});
