import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { GradingWorkflowInput, GradingResult } from './types';

// Configure activity options
const { fetchSubmission, gradeSubmission, saveGradingResult, sendNotification } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes',
    retry: {
      initialInterval: '1s',
      maximumInterval: '30s',
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  });

/**
 * Main workflow for grading a submission
 */
export async function gradeSubmissionWorkflow(
  input: GradingWorkflowInput
): Promise<GradingResult> {
  const { fileId, rubric, folderId } = input;

  console.log(`[Workflow] Starting grading workflow for file: ${fileId}`);

  // Step 1: Fetch the submission from Google Drive
  const submission = await fetchSubmission(fileId);
  console.log(`[Workflow] Fetched submission: ${submission.fileName}`);

  // Step 2: Grade the submission using Gemini
  const gradingResult = await gradeSubmission(submission, rubric);
  console.log(
    `[Workflow] Grading complete. Score: ${gradingResult.totalScore}/${gradingResult.maxScore}`
  );

  // Step 3: Save the grading result back to Google Drive
  const resultFileId = await saveGradingResult(
    folderId,
    submission.fileName,
    gradingResult,
    fileId
  );
  console.log(`[Workflow] Grading result saved with ID: ${resultFileId}`);

  // Step 4: Send notification (optional)
  try {
    await sendNotification(submission.submittedBy, gradingResult);
  } catch (error) {
    console.error(`[Workflow] Error sending notification:`, error);
    // Don't fail the workflow if notification fails
  }

  console.log(`[Workflow] Workflow complete for: ${submission.fileName}`);
  return gradingResult;
}
