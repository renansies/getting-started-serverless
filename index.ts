import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

const LambdaRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.LambdaPrincipal),
    managedPolicyArns: [aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole]
});

const fn = new aws.lambda.Function("fn", {
    role: LambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./app")
    }),
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
});

// A REST API to route requests to HTML content and the Lambda function
const api = new aws.apigateway.RestApi("api");

const method = new aws.apigateway.Method("method", {
    httpMethod: "GET",
    resourceId: api.rootResourceId,
    restApi: api.id,
    authorization: "none"
});

const integration = new aws.apigateway.Integration("integration", {
    httpMethod: method.httpMethod,
    resourceId: api.rootResourceId,
    restApi: api.id,
    type: "AWS_PROXY",
    integrationHttpMethod: "POST",
    uri: fn.invokeArn
});

const deployment = new aws.apigateway.Deployment("deployment", {
    restApi: api.id
}, {dependsOn: [method, integration]});

const stage = new aws.apigateway.Stage("stage", {
    deployment: deployment.id,
    restApi: api.id,
    stageName: "dev"
});

const permission = new aws.lambda.Permission("permission", {
    action: "lambda:InvokeFunction",
    function: fn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*`
});

export const url = pulumi.interpolate`${stage.invokeUrl}`;
