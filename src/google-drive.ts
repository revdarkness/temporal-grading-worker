import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Submission } from './types';

export class GoogleDriveService {
  private drive: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found at ${credentialsPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
      ],
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async listNewSubmissions(folderId: string, processedFileIds: Set<string>): Promise<string[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, createdTime, owners)',
        orderBy: 'createdTime desc',
      });

      const files = response.data.files || [];
      const newFiles = files
        .filter((file: any) => !processedFileIds.has(file.id))
        .map((file: any) => file.id);

      return newFiles;
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  async getSubmission(fileId: string): Promise<Submission> {
    try {
      // Get file metadata
      const metadata = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, createdTime, owners',
      });

      const file = metadata.data;

      // Get file content
      let fileContent = '';
      const mimeType = file.mimeType;

      if (mimeType.includes('text') || mimeType.includes('application/json')) {
        const response = await this.drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'text' }
        );
        fileContent = response.data;
      } else if (mimeType.includes('document')) {
        // Export Google Docs as plain text
        const response = await this.drive.files.export({
          fileId,
          mimeType: 'text/plain',
        });
        fileContent = response.data;
      } else if (mimeType.includes('pdf')) {
        fileContent = '[PDF file - content extraction not implemented]';
      } else {
        fileContent = '[Binary file - content not readable as text]';
      }

      return {
        fileId: file.id,
        fileName: file.name,
        fileContent,
        submittedBy: file.owners?.[0]?.emailAddress || 'Unknown',
        submittedAt: new Date(file.createdTime),
        mimeType: file.mimeType,
      };
    } catch (error) {
      console.error(`Error fetching submission ${fileId}:`, error);
      throw error;
    }
  }

  async saveGradingResult(
    folderId: string,
    fileName: string,
    gradingResult: any,
    originalFileId: string
  ): Promise<string> {
    try {
      // Format the grading result as a readable document
      const resultContent = this.formatGradingResult(gradingResult);

      // Create the result file
      const resultFileName = `GRADED_${fileName}_${Date.now()}.txt`;

      const fileMetadata = {
        name: resultFileName,
        parents: [folderId],
        mimeType: 'text/plain',
      };

      const media = {
        mimeType: 'text/plain',
        body: resultContent,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      const resultFileId = response.data.id;

      // Share the result file with the same users as the original submission
      await this.copyPermissions(originalFileId, resultFileId);

      console.log(`Grading result saved: ${response.data.webViewLink}`);
      return resultFileId;
    } catch (error) {
      console.error('Error saving grading result:', error);
      throw error;
    }
  }

  private async copyPermissions(sourceFileId: string, targetFileId: string) {
    try {
      // Get permissions from source file
      const permissions = await this.drive.permissions.list({
        fileId: sourceFileId,
        fields: 'permissions(id, type, role, emailAddress)',
      });

      // Copy permissions to target file (excluding owner)
      for (const permission of permissions.data.permissions || []) {
        if (permission.role !== 'owner' && permission.emailAddress) {
          try {
            await this.drive.permissions.create({
              fileId: targetFileId,
              requestBody: {
                type: permission.type,
                role: permission.role,
                emailAddress: permission.emailAddress,
              },
              sendNotificationEmail: true,
              emailMessage: 'Your submission has been graded. Please see the attached grading result.',
            });
          } catch (err) {
            console.error(`Error copying permission for ${permission.emailAddress}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('Error copying permissions:', error);
    }
  }

  private formatGradingResult(result: any): string {
    let content = `GRADING RESULT\n`;
    content += `${'='.repeat(80)}\n\n`;
    content += `Submission: ${result.fileName}\n`;
    content += `Graded at: ${new Date(result.gradedAt).toLocaleString()}\n\n`;
    content += `OVERALL SCORE: ${result.totalScore}/${result.maxScore} (${result.percentage.toFixed(1)}%)\n`;
    content += `Status: ${result.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    content += `DETAILED SCORES BY CRITERION:\n\n`;
    for (const criterion of result.criteriaScores) {
      content += `${criterion.criterionName}:\n`;
      content += `  Score: ${criterion.score}/${criterion.maxScore}\n`;
      content += `  Feedback: ${criterion.feedback}\n\n`;
    }

    content += `${'='.repeat(80)}\n\n`;
    content += `OVERALL FEEDBACK:\n\n`;
    content += result.feedback;

    return content;
  }
}
