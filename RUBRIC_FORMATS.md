# Rubric Format Guide

The grading system supports multiple rubric formats to make it easy for you to define your grading criteria.

## Supported Formats

- **JSON** (.json) - Structured data format
- **Markdown** (.md) - Human-readable format
- **Plain Text** (.txt) - Simple text format

## Configuration

Set the rubric file path in your `.env` file:

```bash
RUBRIC_FILE=./rubric.json
# or
RUBRIC_FILE=./rubric.md
# or
RUBRIC_FILE=./rubric.txt
```

## Format Examples

### JSON Format (`rubric.json`)

```json
{
  "criteria": [
    {
      "name": "Content and Understanding",
      "description": "Demonstrates clear understanding of the topic with accurate, relevant, and thorough information.",
      "maxPoints": 30,
      "weight": 1.0
    },
    {
      "name": "Organization and Structure",
      "description": "Content is logically organized with clear introduction, body, and conclusion.",
      "maxPoints": 20
    }
  ],
  "totalPoints": 100,
  "passingScore": 70
}
```

**Field Descriptions:**
- `criteria`: Array of grading criteria
  - `name`: Name of the criterion
  - `description`: What this criterion evaluates
  - `maxPoints`: Maximum points for this criterion
  - `weight`: (Optional) Weighting factor for this criterion
- `totalPoints`: Total points possible (should match sum of maxPoints)
- `passingScore`: (Optional) Minimum score to pass

### Markdown Format (`rubric.md`)

```markdown
# Grading Rubric

Total Points: 100
Passing Score: 70

## Content and Understanding (30 points)
Demonstrates clear understanding of the topic with accurate, relevant, and thorough information. All required elements are present and well-developed.

## Organization and Structure (20 points)
Content is logically organized with clear introduction, body, and conclusion. Ideas flow smoothly with effective transitions.
Weight: 1.5

## Analysis and Critical Thinking (25 points)
Shows depth of analysis, critical thinking, and original insights. Makes connections between ideas and supports arguments with evidence.
```

**Format Rules:**
- First heading (`#`) is the title (optional)
- `Total Points: X` defines the total points
- `Passing Score: X` defines the passing threshold (optional)
- Each criterion starts with `##` heading followed by name and points in parentheses
- Description follows the heading
- `Weight: X` is optional and can be added after the description

### Plain Text Format (`rubric.txt`)

```
TOTAL POINTS: 100
PASSING SCORE: 70

CRITERION: Content and Understanding
POINTS: 30
DESCRIPTION: Demonstrates clear understanding of the topic with accurate, relevant, and thorough information.
WEIGHT: 1.0

CRITERION: Organization and Structure
POINTS: 20
DESCRIPTION: Content is logically organized with clear introduction, body, and conclusion.

CRITERION: Analysis and Critical Thinking
POINTS: 25
DESCRIPTION: Shows depth of analysis, critical thinking, and original insights.
```

**Format Rules:**
- `TOTAL POINTS:` defines the total points (required)
- `PASSING SCORE:` defines the passing threshold (optional)
- Each criterion must have:
  - `CRITERION:` name of the criterion
  - `POINTS:` maximum points for this criterion
  - `DESCRIPTION:` what this criterion evaluates
  - `WEIGHT:` weighting factor (optional)

## Changing the Google Drive Folder

To grade submissions from a different Google Drive folder:

1. Get the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/1eLIqsSIrX4U_Z3FLdO08PcyONR05S3Gp
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            This is the folder ID
   ```

2. Update the `.env` file:
   ```bash
   GOOGLE_DRIVE_FOLDER_ID=1eLIqsSIrX4U_Z3FLdO08PcyONR05S3Gp
   ```

3. Make sure the service account has access to the folder:
   - Share the folder with your service account email: `grading-worker@superagi-396920.iam.gserviceaccount.com`
   - Give it "Editor" permissions

4. Restart the file watcher:
   ```bash
   npm run watch
   ```

## Grading Results

Results are saved locally in the `grading-results/` directory with the format:
```
grading-results/
  └── filename_GRADED.txt
```

Each graded file contains:
- Overall score and percentage
- Pass/Fail status
- Detailed scores for each criterion
- Specific feedback for each criterion
- Overall feedback

View results in the dashboard at http://localhost:3001

## Tips

1. **Choose the format that works best for you:**
   - JSON: Best for programmatic editing or integration
   - Markdown: Best for version control and human readability
   - Plain Text: Simplest format, easy to edit in any text editor

2. **Version control your rubrics:**
   - Keep rubric files in version control to track changes over time
   - Create different rubric files for different assignments

3. **Test your rubric:**
   - Create a test submission to verify your rubric is being parsed correctly
   - Check the dashboard to see how the grading appears

4. **Multiple rubrics:**
   - You can maintain multiple rubric files for different courses or assignments
   - Switch between them by updating the `RUBRIC_FILE` variable in `.env`
