import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

interface GradingResultSummary {
  fileName: string;
  submissionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  gradedAt: string;
  detailedScores: Array<{
    criterionName: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
  overallFeedback: string;
}

/**
 * Parse a grading result text file
 */
function parseGradingResultFile(filePath: string): GradingResultSummary | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract information using regex patterns
    const fileNameMatch = content.match(/File: (.+)/);
    const submissionIdMatch = content.match(/Submission ID: (.+)/);
    const gradedAtMatch = content.match(/Graded At: (.+)/);
    const scoreMatch = content.match(/SCORE: (\d+)\/(\d+) \((\d+\.?\d*)%\)/);
    const statusMatch = content.match(/STATUS: (.+)/);

    if (!fileNameMatch || !scoreMatch) {
      console.error(`Failed to parse file: ${filePath}`);
      return null;
    }

    const fileName = fileNameMatch[1].trim();
    const submissionId = submissionIdMatch ? submissionIdMatch[1].trim() : '';
    const gradedAt = gradedAtMatch ? gradedAtMatch[1].trim() : '';
    const totalScore = parseInt(scoreMatch[1]);
    const maxScore = parseInt(scoreMatch[2]);
    const percentage = parseFloat(scoreMatch[3]);
    const passed = statusMatch ? statusMatch[1].includes('PASSED') : false;

    // Extract detailed scores
    const detailedScoresSection = content.split('DETAILED SCORES')[1]?.split('OVERALL FEEDBACK')[0];
    const detailedScores: Array<{
      criterionName: string;
      score: number;
      maxScore: number;
      feedback: string;
    }> = [];

    if (detailedScoresSection) {
      const criterionBlocks = detailedScoresSection.split(/\n\n+/).filter(b => b.trim());
      for (const block of criterionBlocks) {
        const lines = block.trim().split('\n');
        if (lines.length >= 2) {
          const firstLine = lines[0];
          const scoreLineMatch = firstLine.match(/(.+): (\d+)\/(\d+) points/);
          if (scoreLineMatch) {
            detailedScores.push({
              criterionName: scoreLineMatch[1].trim(),
              score: parseInt(scoreLineMatch[2]),
              maxScore: parseInt(scoreLineMatch[3]),
              feedback: lines.slice(1).join('\n').trim()
            });
          }
        }
      }
    }

    // Extract overall feedback
    const feedbackSection = content.split('OVERALL FEEDBACK')[1];
    const overallFeedback = feedbackSection
      ? feedbackSection.split('='.repeat(80))[0].trim()
      : 'No overall feedback available';

    return {
      fileName,
      submissionId,
      totalScore,
      maxScore,
      percentage,
      passed,
      gradedAt,
      detailedScores,
      overallFeedback
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * API endpoint to get all grading results
 */
app.get('/api/results', (req, res) => {
  try {
    const resultsDir = path.join(process.cwd(), 'grading-results');

    // Check if directory exists
    if (!fs.existsSync(resultsDir)) {
      return res.json([]);
    }

    // Read all files in the directory
    const files = fs.readdirSync(resultsDir)
      .filter(file => file.endsWith('_GRADED.txt'))
      .map(file => path.join(resultsDir, file));

    // Parse each file
    const results = files
      .map(file => parseGradingResultFile(file))
      .filter(result => result !== null)
      .sort((a, b) => {
        // Sort by graded date, newest first
        return new Date(b!.gradedAt).getTime() - new Date(a!.gradedAt).getTime();
      });

    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * API endpoint to get current configuration
 */
app.get('/api/config', (req, res) => {
  try {
    const config = {
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
      rubricFile: process.env.RUBRIC_FILE || './rubric.json',
      pollingInterval: process.env.POLLING_INTERVAL || '60000',
    };
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

/**
 * API endpoint to update configuration
 */
app.post('/api/config', (req, res) => {
  try {
    const { folderId, rubricFile } = req.body;

    if (!folderId || !rubricFile) {
      return res.status(400).json({ error: 'folderId and rubricFile are required' });
    }

    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add GOOGLE_DRIVE_FOLDER_ID
    if (envContent.includes('GOOGLE_DRIVE_FOLDER_ID=')) {
      envContent = envContent.replace(
        /GOOGLE_DRIVE_FOLDER_ID=.*/,
        `GOOGLE_DRIVE_FOLDER_ID=${folderId}`
      );
    } else {
      envContent += `\nGOOGLE_DRIVE_FOLDER_ID=${folderId}`;
    }

    // Update or add RUBRIC_FILE
    if (envContent.includes('RUBRIC_FILE=')) {
      envContent = envContent.replace(
        /RUBRIC_FILE=.*/,
        `RUBRIC_FILE=${rubricFile}`
      );
    } else {
      envContent += `\nRUBRIC_FILE=${rubricFile}`;
    }

    // Write updated .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');

    // Update process.env for current process
    process.env.GOOGLE_DRIVE_FOLDER_ID = folderId;
    process.env.RUBRIC_FILE = rubricFile;

    res.json({
      success: true,
      message: 'Configuration updated. Please restart the file watcher for changes to take effect.',
      config: { folderId, rubricFile }
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

app.listen(PORT, () => {
  console.log(`\n📊 Dashboard running at http://localhost:${PORT}`);
  console.log(`Watching grading-results/ directory for updates\n`);
});
