/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import * as cdk  from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { FlinkStudio } from '../lib/kda-flink-studio';
import { FlinkLogLevels } from '../lib/kda-base';

let stack: cdk.Stack;

beforeAll(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    new FlinkStudio(stack, 'TestApplication', {
        logsRetentionDays: logs.RetentionDays.ONE_WEEK,
        logLevel: FlinkLogLevels.INFO,

        subnetIds: ['subnet-a', 'subnet-b'],
        securityGroupIds: ['sg-123'],

        clusterArn: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-uuid'
    });
});

test('configures logging for the KDA studio', () => {
    Template.fromStack(stack).hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
    });

    expect(Object.keys(Template.fromStack(stack).findResources('AWS::Logs::LogStream')).length).toBeGreaterThan(0);
    expect(Object.keys(Template.fromStack(stack).findResources('AWS::KinesisAnalyticsV2::ApplicationCloudWatchLoggingOption')).length).toBeGreaterThan(0);
});

test('creates an IAM role for KDA', () => {
    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
            Statement: [{
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                    Service: 'kinesisanalytics.amazonaws.com'
                }
            }],
            Version: '2012-10-17'
        }
    });
});

test('adds cfn_nag suppressions', () => {
    Template.fromStack(stack).hasResource('AWS::IAM::Role', {
        Metadata: {
            cfn_nag: {
                rules_to_suppress: [{
                    id: 'W11',
                    reason: 'EC2 actions do not support resource level permissions / Studio uses default Glue database'
                }]
            }
        }
    });
});
