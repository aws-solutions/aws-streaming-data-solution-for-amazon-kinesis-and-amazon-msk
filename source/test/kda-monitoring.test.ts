/*********************************************************************************************************************
 *  Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                      *
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

import * as cdk from '@aws-cdk/core';
import { SynthUtils, expect as expectCDK, haveResource } from '@aws-cdk/assert';

import { ApplicationMonitoring } from '../lib/kda-monitoring';

describe('kinesis data stream as source', () => {
    let stack: cdk.Stack;

    beforeAll(() => {
        const app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');

        new ApplicationMonitoring(stack, 'Dashboard', {
            applicationName: 'test-application',
            logGroupName: 'test-log-group',
            inputStreamName: 'test-stream'
        });
    });

    test('creates a dashboard for a Flink application', () => {
        expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });

    test('creates downtime alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'downtime',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'GreaterThanThreshold',
            Statistic: 'Average',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 0,
            TreatMissingData: 'breaching',
            Dimensions: [{ Name: 'Application', Value: 'test-application' }]
        }));
    });

    test('creates numberOfFailedCheckpoints alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'numberOfFailedCheckpoints',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'GreaterThanThreshold',
            Statistic: 'Average',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 0,
            TreatMissingData: 'breaching',
            Dimensions: [{ Name: 'Application', Value: 'test-application' }]
        }));
    });

    test('creates numRecordsOutPerSecond alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'numRecordsOutPerSecond',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'LessThanOrEqualToThreshold',
            Statistic: 'Average',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 0,
            TreatMissingData: 'breaching',
            Dimensions: [{ Name: 'Application', Value: 'test-application' }]
        }));
    });

    test('creates millisBehindLatest alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'millisBehindLatest',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'GreaterThanThreshold',
            Statistic: 'Maximum',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 60000,
            TreatMissingData: 'breaching',
            Dimensions: [
                { Name: 'Application', Value: 'test-application' },
                { Name: 'Flow', Value: 'Input' },
                { Name: 'Id', Value: 'test_stream' }
            ]
        }));
    });

    test('creates cpuUtilization alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'cpuUtilization',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'GreaterThanThreshold',
            Statistic: 'Maximum',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 80,
            TreatMissingData: 'breaching',
            Dimensions: [{ Name: 'Application', Value: 'test-application' }]
        }));
    });

    test('creates heapMemoryUtilization alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            MetricName: 'heapMemoryUtilization',
            Namespace: 'AWS/KinesisAnalytics',
            ComparisonOperator: 'GreaterThanThreshold',
            Statistic: 'Maximum',
            EvaluationPeriods: 1,
            Period: 60,
            Threshold: 90,
            TreatMissingData: 'breaching',
            Dimensions: [{ Name: 'Application', Value: 'test-application' }]
        }));
    });

    test('creates oldGenerationGCTime alarm', () => {
        expectCDK(stack).to(haveResource('AWS::CloudWatch::Alarm', {
            ComparisonOperator: 'GreaterThanThreshold',
            EvaluationPeriods: 1,
            Threshold: 60,
            Metrics: [
                {
                    Expression: '(m1 * 100)/60000',
                    Id: 'expr_1',
                    Label: 'Old Generation GC Time Percent'
                },
                {
                    Id: 'm1',
                    MetricStat: {
                        Metric: {
                            Dimensions: [{ Name: 'Application', Value: 'test-application'}],
                            MetricName: 'oldGenerationGCTime',
                            Namespace: 'AWS/KinesisAnalytics'
                        },
                        Period: 60,
                        Stat: 'Maximum'
                    },
                    ReturnData: false
                }
            ],
            TreatMissingData: 'breaching'
        }));
    });
});

describe('kafka topic as source', () => {
    test('creates a dashboard for a Flink application', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');

        new ApplicationMonitoring(stack, 'Dashboard', {
            applicationName: 'test-application',
            logGroupName: 'test-log-group',
            kafkaTopicName: 'test-topic'
        });

        expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });
});
