import { Worker } from '@temporalio/worker';
import * as activities from './activities';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function run() {
  try {
    const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
    const taskQueue = process.env.TASK_QUEUE || 'grading-queue';

    console.log('Starting Temporal Worker...');
    console.log(`Temporal Address: ${temporalAddress}`);
    console.log(`Namespace: ${namespace}`);
    console.log(`Task Queue: ${taskQueue}`);

    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue,
      namespace,
    });

    console.log('Worker created successfully');
    console.log('Listening for workflows...');

    await worker.run();
  } catch (error) {
    console.error('Error starting worker:', error);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
