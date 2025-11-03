import * as fs from 'fs';
import * as path from 'path';
import { Rubric } from './types';

/**
 * Parse rubric from different file formats
 */
export class RubricParser {
  /**
   * Load and parse rubric from file
   */
  static loadRubric(filePath: string): Rubric {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Rubric file not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return this.parseJSON(filePath);
      case '.md':
      case '.markdown':
        return this.parseMarkdown(filePath);
      case '.txt':
        return this.parseText(filePath);
      default:
        throw new Error(`Unsupported rubric file format: ${ext}. Supported formats: .json, .md, .txt`);
    }
  }

  /**
   * Parse JSON rubric file
   */
  private static parseJSON(filePath: string): Rubric {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rubric = JSON.parse(content);

    // Validate rubric structure
    if (!rubric.criteria || !Array.isArray(rubric.criteria)) {
      throw new Error('Invalid rubric: missing or invalid criteria array');
    }

    if (typeof rubric.totalPoints !== 'number') {
      throw new Error('Invalid rubric: missing or invalid totalPoints');
    }

    return rubric as Rubric;
  }

  /**
   * Parse Markdown rubric file
   * Expected format:
   * # Grading Rubric
   *
   * Total Points: 100
   * Passing Score: 70
   *
   * ## Criterion Name (30 points)
   * Description of the criterion
   * Weight: 1.5 (optional)
   */
  private static parseMarkdown(filePath: string): Rubric {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let totalPoints = 0;
    let passingScore: number | undefined;
    const criteria: Array<{
      name: string;
      description: string;
      maxPoints: number;
      weight?: number;
    }> = [];

    let currentCriterion: any = null;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse total points
      if (line.startsWith('Total Points:')) {
        totalPoints = parseInt(line.replace('Total Points:', '').trim());
      }

      // Parse passing score
      if (line.startsWith('Passing Score:')) {
        passingScore = parseInt(line.replace('Passing Score:', '').trim());
      }

      // Parse criterion header (## Criterion Name (30 points))
      if (line.startsWith('## ')) {
        // Save previous criterion
        if (currentCriterion) {
          currentCriterion.description = descriptionLines.join(' ').trim();
          criteria.push(currentCriterion);
          descriptionLines = [];
        }

        const match = line.match(/##\s+(.+?)\s+\((\d+)\s+points?\)/);
        if (match) {
          currentCriterion = {
            name: match[1].trim(),
            maxPoints: parseInt(match[2]),
            description: '',
          };
        }
      }

      // Parse weight (optional)
      if (line.startsWith('Weight:') && currentCriterion) {
        currentCriterion.weight = parseFloat(line.replace('Weight:', '').trim());
      }

      // Collect description lines
      if (currentCriterion && !line.startsWith('##') && !line.startsWith('Weight:') && !line.startsWith('#') && line.length > 0) {
        descriptionLines.push(line);
      }
    }

    // Save last criterion
    if (currentCriterion) {
      currentCriterion.description = descriptionLines.join(' ').trim();
      criteria.push(currentCriterion);
    }

    if (totalPoints === 0) {
      throw new Error('Invalid markdown rubric: Total Points not found');
    }

    if (criteria.length === 0) {
      throw new Error('Invalid markdown rubric: No criteria found');
    }

    return {
      criteria,
      totalPoints,
      passingScore,
    };
  }

  /**
   * Parse plain text rubric file
   * Expected format:
   * TOTAL POINTS: 100
   * PASSING SCORE: 70
   *
   * CRITERION: Criterion Name
   * POINTS: 30
   * DESCRIPTION: Description of the criterion
   * WEIGHT: 1.5 (optional)
   */
  private static parseText(filePath: string): Rubric {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let totalPoints = 0;
    let passingScore: number | undefined;
    const criteria: Array<{
      name: string;
      description: string;
      maxPoints: number;
      weight?: number;
    }> = [];

    let currentCriterion: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('TOTAL POINTS:')) {
        totalPoints = parseInt(trimmed.replace('TOTAL POINTS:', '').trim());
      }

      if (trimmed.startsWith('PASSING SCORE:')) {
        passingScore = parseInt(trimmed.replace('PASSING SCORE:', '').trim());
      }

      if (trimmed.startsWith('CRITERION:')) {
        if (currentCriterion) {
          criteria.push(currentCriterion);
        }
        currentCriterion = {
          name: trimmed.replace('CRITERION:', '').trim(),
          description: '',
          maxPoints: 0,
        };
      }

      if (trimmed.startsWith('POINTS:') && currentCriterion) {
        currentCriterion.maxPoints = parseInt(trimmed.replace('POINTS:', '').trim());
      }

      if (trimmed.startsWith('DESCRIPTION:') && currentCriterion) {
        currentCriterion.description = trimmed.replace('DESCRIPTION:', '').trim();
      }

      if (trimmed.startsWith('WEIGHT:') && currentCriterion) {
        currentCriterion.weight = parseFloat(trimmed.replace('WEIGHT:', '').trim());
      }
    }

    if (currentCriterion) {
      criteria.push(currentCriterion);
    }

    if (totalPoints === 0) {
      throw new Error('Invalid text rubric: TOTAL POINTS not found');
    }

    if (criteria.length === 0) {
      throw new Error('Invalid text rubric: No criteria found');
    }

    return {
      criteria,
      totalPoints,
      passingScore,
    };
  }
}
