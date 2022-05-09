import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import * as path from 'path';
import { DDB_TABLE_CHAT, DDB_TABLE_GSI_CHAT } from './handler/constants';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaDdbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'DDB-Chat', {
      tableName: DDB_TABLE_CHAT,
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'time', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    }); 

    table.addGlobalSecondaryIndex(
      {
        indexName: DDB_TABLE_GSI_CHAT,
        partitionKey: {name: 'chat_room', type: dynamodb.AttributeType.STRING},
        sortKey: {name: 'time', type: dynamodb.AttributeType.STRING},
        projectionType: dynamodb.ProjectionType.ALL,
      }
    );

    // create lambda funciton
    const fn = new lambda.Function(this, 'Lambda-Chat', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'handler')),
      functionName: 'chat-room',
      timeout: Duration.minutes(1)
    });

    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, 'Lambda-FunctionUrl', {
      value: fnUrl.url,
    });

    // Grant lambda function DDB read/write permission
    table.grantReadWriteData(fn);
  }
}
