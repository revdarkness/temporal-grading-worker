# Quick Setup Guide

Follow these steps to get your grading worker up and running.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd temporal-grading-worker
npm install
```

### 2. Google Cloud Setup

#### Create Service Account

1. Visit: https://console.cloud.google.com/
2. Create or select a project
3. Navigate to: **APIs & Services > Library**
4. Search for and enable: **Google Drive API**
5. Navigate to: **APIs & Services > Credentials**
6. Click: **Create Credentials > Service Account**
7. Name it (e.g., "grading-worker")
8. Click **Create and Continue**
9. Skip optional steps, click **Done**

#### Download Credentials

1. Click on your new service account
2. Go to the **Keys** tab
3. Click **Add Key > Create new key**
4. Select **JSON**
5. Save the downloaded file as `credentials.json` in this project folder

#### Get Service Account Email

Open `credentials.json` and copy the `client_email` value. You'll need this next.

### 3. Google Drive Setup

1. Create a folder in Google Drive for submissions
2. Right-click the folder > **Share**
3. Paste your service account email (from `credentials.json`)
4. Give it **Editor** access
5. Copy the folder ID from the URL:
   - URL looks like: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy the `FOLDER_ID_HERE` part

### 4. Gemini API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the generated key

### 5. Create .env File

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-from-step-3
GEMINI_API_KEY=your-api-key-from-step-4
```

### 6. Create Rubric

```bash
cp rubric.example.json rubric.json
```

(Optional) Edit `rubric.json` to customize grading criteria.

### 7. Start Temporal Server

**Option A - Using Temporal CLI:**

```bash
temporal server start-dev
```

**Option B - Using Docker:**

```bash
docker run -p 7233:7233 temporalio/auto-setup
```

Leave this running in a terminal.

### 8. Build the Project

```bash
npm run build
```

### 9. Start the System

**Terminal 1 - Start the Worker:**

```bash
npm start
```

**Terminal 2 - Start the File Watcher:**

```bash
npm run watch
```

### 10. Test It

1. Upload a text file to your Google Drive folder
2. Watch the terminal logs
3. After ~1 minute, a graded file should appear in the same folder

## Quick Test

Create a test submission file:

**test-submission.txt:**

```
# My Essay on Climate Change

Climate change is one of the most pressing issues of our time. It refers to long-term shifts in global temperatures and weather patterns.

## Causes

The primary cause is human activity, particularly the burning of fossil fuels which releases greenhouse gases into the atmosphere.

## Effects

Effects include rising sea levels, extreme weather events, and disruption to ecosystems.

## Solutions

We need to transition to renewable energy, improve energy efficiency, and protect natural carbon sinks like forests.

## Conclusion

Addressing climate change requires global cooperation and immediate action.
```

Upload this to your Google Drive folder and wait for it to be graded!

## Troubleshooting

### Worker won't start

- Check that Temporal server is running on `localhost:7233`
- Run: `temporal server start-dev` in a separate terminal

### Can't connect to Google Drive

- Verify `credentials.json` exists
- Check that service account email has access to the folder
- Ensure Google Drive API is enabled in Google Cloud Console

### Gemini API errors

- Check your API key in `.env`
- Verify you have quota remaining at https://aistudio.google.com/app/apikey
- Try using `gemini-1.5-flash` model if you hit rate limits

### No files detected

- Wait at least 1 minute (default polling interval)
- Check folder ID is correct
- Ensure file is in the correct folder, not a subfolder
- Check worker logs for errors

## Need Help?

Check the full README.md for more detailed information and advanced configuration options.
