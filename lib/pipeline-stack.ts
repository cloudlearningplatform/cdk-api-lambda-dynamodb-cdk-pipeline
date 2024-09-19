import { Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { WorkshopPipelineStage } from "./pipeline-stage";

export class WorkshopPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Creates a CodeCommit repository called 'WorkshopRepo'
    const repo = new Repository(this, "WorkshopRepo", {
      repositoryName: "WorkshopRepo",
    });

    // The basic pipeline declaration. This sets the initial structure
    // of our pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "WorkshopPipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.codeCommit(repo, "main"),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Deploy stage
    const deploy = new WorkshopPipelineStage(this, "Deploy");
    const deployStage = pipeline.addStage(deploy);

    // Add post-deployment tests
    deployStage.addPost(
      new CodeBuildStep('TestViewerEndpoint', {
        projectName: 'TestViewerEndpoint',
        envFromCfnOutputs: {
          ENDPOINT_URL: deploy.hcViewerUrl,  // Refer to the output of hcViewerUrl
        },
        commands: [
          'curl -Ssf $ENDPOINT_URL'  // Test the Viewer endpoint
        ],
      }),

      new CodeBuildStep('TestAPIGatewayEndpoint', {
        projectName: 'TestAPIGatewayEndpoint',
        envFromCfnOutputs: {
          ENDPOINT_URL: deploy.hcEndpoint,  // Refer to the output of hcEndpoint
        },
        commands: [
          'curl -Ssf $ENDPOINT_URL',          // Test the root API Gateway endpoint
          'curl -Ssf $ENDPOINT_URL/hello',    // Test the /hello path
          'curl -Ssf $ENDPOINT_URL/test',     // Test the /test path
        ],
      })
    );
  }
}