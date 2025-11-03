import { Connection, Client } from '@temporalio/client';
import { GoogleDriveService } from './google-drive';
import { Rubric, GradingWorkflowInput } from './types';
import { RubricParser } from './rubric-parser';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Track processed files
const processedFileIds = new Set<string>();

// Default rubric (can be overridden by loading from a file)
const defaultRubric: Rubric = {
  criteria: [
    {
      name: 'Completeness',
      description: 'All required sections and elements are present',
      maxPoints: 25,
    },
    {
      name: 'Accuracy',
      description: 'Information is correct and well-researched',
      maxPoints: 25,
    },
    {
      name: 'Clarity',
      description: 'Writing is clear, well-organized, and easy to understand',
      maxPoints: 25,
    },
    {
      name: 'Quality',
      description: 'Overall quality of work, attention to detail, and professionalism',
      maxPoints: 25,
    },
  ],
  totalPoints: 100,
  passingScore: 60,
};

async function loadRubric(): Promise<Rubric> {
  const rubricPath = process.env.RUBRIC_FILE || './rubric.json';

  try {
    console.log(`Loading rubric from ${rubricPath}`);
    return RubricParser.loadRubric(rubricPath);
  } catch (error) {
    console.error(`Error loading rubric from ${rubricPath}:`, error);
    console.log('Using default rubric');
    return defaultRubric;
  }
}

async function watchFolder() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const pollingInterval = parseInt(process.env.POLLING_INTERVAL || '60000', 10);
  const taskQueue = process.env.TASK_QUEUE || 'grading-queue';
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not set');
  }

  console.log('Initializing Google Drive service...');
  const driveService = new GoogleDriveService();

  console.log('Loading rubric...');
  const rubric = await loadRubric();

  console.log('Connecting to Temporal...');
  const connection = await Connection.connect({ address: temporalAddress });
  const client = new Client({ connection, namespace });

  console.log('File watcher started');
  console.log(`Watching folder: ${folderId}`);
  console.log(`Polling interval: ${pollingInterval}ms`);
  console.log(`Task queue: ${taskQueue}`);

  // Main polling loop
  while (true) {
    try {
      console.log(`[${new Date().toISOString()}] Checking for new submissions...`);

      const newFileIds = await driveService.listNewSubmissions(folderId, processedFileIds);

      if (newFileIds.length > 0) {
        console.log(`Found ${newFileIds.length} new submission(s)`);

        for (const fileId of newFileIds) {
          try {
            console.log(`Starting workflow for file: ${fileId}`);

            const workflowInput: GradingWorkflowInput = {
              fileId,
              rubric,
              folderId,
            };

            // Start the workflow
            const handle = await client.workflow.start('gradeSubmissionWorkflow', {
              taskQueue,
              args: [workflowInput],
              workflowId: `grade-${fileId}-${Date.now()}`,
            });

            console.log(`Workflow started: ${handle.workflowId}`);

            // Mark as processed
            processedFileIds.add(fileId);
          } catch (error) {
            console.error(`Error starting workflow for file ${fileId}:`, error);
          }
        }
      } else {
        console.log('No new submissions found');
      }
    } catch (error) {
      console.error('Error in polling loop:', error);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}

// Start watching
watchFolder().catch((err) => {
  console.error('Fatal error in file watcher:', err);
  process.exit(1);
});
