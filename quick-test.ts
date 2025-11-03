import { Connection, Client } from '@temporalio/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  try {
    console.log('Connecting to Temporal...');
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });

    // Simple rubric
    const rubric = {
      criteria: [
        {
          name: 'Test Criterion',
          description: 'A simple test',
          maxPoints: 100,
        },
      ],
      totalPoints: 100,
      passingScore: 60,
    };

    // Use one of the existing file IDs
    const fileId = '1vFw0cdoEpABimklDEir58SlAIe50HtWy'; // newentry3_average.txt

    console.log(`Starting workflow for file: ${fileId}`);

    const handle = await client.workflow.start('gradeSubmissionWorkflow', {
      taskQueue: 'grading-queue',
      args: [{
        fileId,
        rubric,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      }],
      workflowId: `quick-test-${Date.now()}`,
    });

    console.log(`Workflow started: ${handle.workflowId}`);
    console.log('Waiting for result...\n');

    const result = await handle.result();

    console.log('=== RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nCheck grading-results folder for the graded file!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

quickTest();
