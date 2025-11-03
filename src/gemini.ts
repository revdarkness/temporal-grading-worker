import { GoogleGenerativeAI } from '@google/generative-ai';
import { Rubric, Submission, GradingResult, CriterionScore } from './types';

export class GeminiGradingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async gradeSubmission(submission: Submission, rubric: Rubric): Promise<GradingResult> {
    try {
      const prompt = this.buildGradingPrompt(submission, rubric);

      console.log(`Grading submission: ${submission.fileName}`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const gradingResult = this.parseGradingResponse(text, submission, rubric);

      return gradingResult;
    } catch (error) {
      console.error('Error grading submission with Gemini:', error);
      throw error;
    }
  }

  private buildGradingPrompt(submission: Submission, rubric: Rubric): string {
    let prompt = `You are an expert grader. Grade the following submission according to the provided rubric.\n\n`;

    prompt += `SUBMISSION DETAILS:\n`;
    prompt += `File Name: ${submission.fileName}\n`;
    prompt += `Submitted By: ${submission.submittedBy}\n`;
    prompt += `Submitted At: ${submission.submittedAt.toISOString()}\n\n`;

    prompt += `SUBMISSION CONTENT:\n`;
    prompt += `${'='.repeat(80)}\n`;
    prompt += `${submission.fileContent}\n`;
    prompt += `${'='.repeat(80)}\n\n`;

    prompt += `GRADING RUBRIC:\n`;
    prompt += `Total Points: ${rubric.totalPoints}\n`;
    if (rubric.passingScore) {
      prompt += `Passing Score: ${rubric.passingScore}\n`;
    }
    prompt += `\nCRITERIA:\n`;

    rubric.criteria.forEach((criterion, index) => {
      prompt += `\n${index + 1}. ${criterion.name} (${criterion.maxPoints} points)\n`;
      prompt += `   Description: ${criterion.description}\n`;
      if (criterion.weight) {
        prompt += `   Weight: ${criterion.weight}x\n`;
      }
    });

    prompt += `\n\nINSTRUCTIONS:\n`;
    prompt += `Grade this submission carefully according to each criterion in the rubric.\n`;
    prompt += `Provide your response in the following JSON format:\n\n`;
    prompt += `{\n`;
    prompt += `  "criteriaScores": [\n`;
    prompt += `    {\n`;
    prompt += `      "criterionName": "name of the criterion",\n`;
    prompt += `      "score": numeric_score,\n`;
    prompt += `      "maxScore": max_points_for_criterion,\n`;
    prompt += `      "feedback": "detailed feedback for this criterion"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "overallFeedback": "overall feedback about the submission"\n`;
    prompt += `}\n\n`;
    prompt += `Be fair, thorough, and constructive in your grading and feedback.`;

    return prompt;
  }

  private parseGradingResponse(
    responseText: string,
    submission: Submission,
    rubric: Rubric
  ): GradingResult {
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = responseText.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonText);

      // Calculate total score
      const criteriaScores: CriterionScore[] = parsed.criteriaScores || [];
      const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
      const maxScore = rubric.totalPoints;
      const percentage = (totalScore / maxScore) * 100;
      const passed = rubric.passingScore ? totalScore >= rubric.passingScore : percentage >= 60;

      return {
        submissionId: submission.fileId,
        fileName: submission.fileName,
        totalScore,
        maxScore,
        percentage,
        passed,
        criteriaScores,
        feedback: parsed.overallFeedback || 'No overall feedback provided.',
        gradedAt: new Date(),
      };
    } catch (error) {
      console.error('Error parsing grading response:', error);
      console.error('Response text:', responseText);

      // Fallback: return a default grading result
      return {
        submissionId: submission.fileId,
        fileName: submission.fileName,
        totalScore: 0,
        maxScore: rubric.totalPoints,
        percentage: 0,
        passed: false,
        criteriaScores: rubric.criteria.map(c => ({
          criterionName: c.name,
          score: 0,
          maxScore: c.maxPoints,
          feedback: 'Error parsing grading response',
        })),
        feedback: `Error grading submission: ${error}`,
        gradedAt: new Date(),
      };
    }
  }
}
