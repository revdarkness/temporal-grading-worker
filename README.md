# Temporal Grading Worker

A Temporal-based automated grading system that monitors Google Drive for submissions and grades them using Google's Gemini AI.

## Features

- **Automated Monitoring**: Watches a Google Drive folder for new submissions
- **AI-Powered Grading**: Uses Gemini to grade submissions against a customizable rubric
- **Temporal Workflows**: Reliable, scalable workflow execution with automatic retries
- **Results Sharing**: Automatically saves grading results to Google Drive and shares with submitters
- **Customizable Rubrics**: Define your own grading criteria in JSON format

## Architecture

The system consists of three main components:

1. **File Watcher** (`file-watcher.ts`): Polls Google Drive for new submissions and triggers workflows
2. **Temporal Worker** (`worker.ts`): Executes grading workflows and activities
3. **Grading Workflow** (`workflows.ts`): Orchestrates the grading process

### Workflow Steps

1. Fetch submission from Google Drive
2. Grade submission using Gemini AI based on rubric
3. Save grading results to Google Drive
4. Share results with original submitters

## Prerequisites

- Node.js 18+ and npm
- Temporal Server running locally or remotely
- Google Cloud Project with Drive API enabled
- Google Gemini API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name and click "Create"
   - Grant it the role "Editor" (or customize as needed)
   - Click "Done"
5. Create and download credentials:
   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Save the file as `credentials.json` in the project root

### 3. Set Up Google Drive Folder

1. Create a folder in Google Drive for submissions
2. Share the folder with your service account email (found in `credentials.json`)
3. Give it "Editor" permissions
4. Copy the folder ID from the URL (the long string after `/folders/`)

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the key for use in your `.env` file

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TASK_QUEUE=grading-queue

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=your-actual-folder-id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Gemini API Configuration
GEMINI_API_KEY=your-actual-gemini-api-key

# Polling interval in milliseconds
POLLING_INTERVAL=60000
```

### 6. Customize the Rubric (Optional)

Copy the example rubric:

```bash
cp rubric.example.json rubric.json
```

Edit `rubric.json` to customize your grading criteria:

```json
{
  "criteria": [
    {
      "name": "Criterion Name",
      "description": "What you're looking for",
      "maxPoints": 25
    }
  ],
  "totalPoints": 100,
  "passingScore": 70
}
```

### 7. Start Temporal Server

If you don't have Temporal running, start it with:

```bash
# Using Temporal CLI
temporal server start-dev
```

Or use Docker:

```bash
docker run -p 7233:7233 temporalio/auto-setup
```

## Running the System

### Build the Project

```bash
npm run build
```

### Start the Worker

In one terminal:

```bash
npm start
# or for development:
npm run dev
```

### Start the File Watcher

In another terminal:

```bash
npm run watch
```

## How It Works

1. The file watcher polls your Google Drive folder every minute (configurable)
2. When a new file is detected, it starts a Temporal workflow
3. The workflow:
   - Fetches the submission content from Google Drive
   - Sends it to Gemini with your rubric for grading
   - Parses the grading response
   - Saves a formatted grading result to the same folder
   - Shares the result with the same users who can access the original submission
4. The worker handles retries automatically if any step fails

## File Structure

```
temporal-grading-worker/
├── src/
│   ├── types.ts           # TypeScript type definitions
│   ├── google-drive.ts    # Google Drive integration
│   ├── gemini.ts          # Gemini AI integration
│   ├── activities.ts      # Temporal activities
│   ├── workflows.ts       # Temporal workflows
│   ├── worker.ts          # Worker entry point
│   └── file-watcher.ts    # File watcher service
├── credentials.json       # Google service account credentials (DO NOT COMMIT)
├── rubric.json           # Your custom rubric (DO NOT COMMIT if sensitive)
├── .env                  # Environment variables (DO NOT COMMIT)
├── package.json
└── tsconfig.json
```

## Customization

### Adjust Polling Interval

Change `POLLING_INTERVAL` in `.env` (in milliseconds):

```env
POLLING_INTERVAL=30000  # Poll every 30 seconds
```

### Modify Activity Timeouts

Edit `src/workflows.ts` to adjust timeouts:

```typescript
const { fetchSubmission, gradeSubmission, saveGradingResult } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes',  // Adjust this
    // ...
  });
```

### Change Gemini Model

Edit `src/gemini.ts`:

```typescript
this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

## Troubleshooting

### "Credentials file not found"
- Ensure `credentials.json` is in the project root
- Check that `GOOGLE_APPLICATION_CREDENTIALS` in `.env` points to the correct path

### "GEMINI_API_KEY environment variable is not set"
- Make sure you've set `GEMINI_API_KEY` in your `.env` file
- Restart the worker after updating `.env`

### No files detected
- Verify the folder ID is correct
- Ensure the service account has access to the folder
- Check the worker logs for errors

### Grading fails
- Check that your rubric is valid JSON
- Ensure Gemini API key is valid and has quota remaining
- Review the worker logs for detailed error messages

## API Reference

### Rubric Format

```typescript
interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingScore?: number;
}

interface RubricCriterion {
  name: string;
  description: string;
  maxPoints: number;
  weight?: number;
}
```

### Grading Result Format

```typescript
interface GradingResult {
  submissionId: string;
  fileName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  criteriaScores: CriterionScore[];
  feedback: string;
  gradedAt: Date;
}
```

## Security Notes

- **Never commit** `credentials.json`, `.env`, or `rubric.json` if it contains sensitive data
- Add them to `.gitignore`
- Use service accounts with minimal required permissions
- Rotate API keys regularly
- Consider using Google Secret Manager for production deployments

## Future Enhancements

- Email notifications to students
- Support for batch grading
- Web dashboard for viewing results
- Multiple rubric support
- PDF and image submission support
- Plagiarism detection
- Analytics and reporting

## License

MIT
