import { Connection, Client } from '@temporalio/client';
import { GradingWorkflowInput, Rubric } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

// Example rubric for testing
const testRubric: Rubric = {
  criteria: [
    {
      name: 'Content Quality',
      description: 'The submission demonstrates understanding of the topic with accurate information',
      maxPoints: 40,
    },
    {
      name: 'Organization',
      description: 'Content is well-organized with clear structure and logical flow',
      maxPoints: 30,
    },
    {
      name: 'Writing Quality',
      description: 'Grammar, spelling, and writing style are appropriate',
      maxPoints: 30,
    },
  ],
  totalPoints: 100,
  passingScore: 70,
};

async function runTestWorkflow() {
  const fileId = process.argv[2];

  if (!fileId) {
    console.error('Usage: ts-node src/test-client.ts <fileId>');
    console.error('Example: ts-node src/test-client.ts 1abc123xyz');
    process.exit(1);
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.error('GOOGLE_DRIVE_FOLDER_ID not set in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to Temporal...');
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });

    console.log(`Starting workflow for file: ${fileId}`);

    const workflowInput: GradingWorkflowInput = {
      fileId,
      rubric: testRubric,
      folderId,
    };

    const handle = await client.workflow.start('gradeSubmissionWorkflow', {
      taskQueue: process.env.TASK_QUEUE || 'grading-queue',
      args: [workflowInput],
      workflowId: `test-grade-${fileId}-${Date.now()}`,
    });

    console.log(`Workflow started with ID: ${handle.workflowId}`);
    console.log('Waiting for result...');

    const result = await handle.result();

    console.log('\n=== GRADING RESULT ===');
    console.log(`File: ${result.fileName}`);
    console.log(`Score: ${result.totalScore}/${result.maxScore} (${result.percentage.toFixed(1)}%)`);
    console.log(`Status: ${result.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    console.log('\nDetailed Scores:');
    result.criteriaScores.forEach((cs: any) => {
      console.log(`  ${cs.criterionName}: ${cs.score}/${cs.maxScore}`);
      console.log(`    ${cs.feedback}`);
    });
    console.log(`\nOverall Feedback:\n${result.feedback}`);
    console.log('\n=====================\n');
  } catch (error) {
    console.error('Error running test workflow:', error);
    process.exit(1);
  }
}

runTestWorkflow();
