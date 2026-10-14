/**
 * Agricultural Server-Side Tool Registry & Dispatcher
 */

import { getWeatherDeclaration, executeGetWeather } from './weatherTool.ts';
import {
  analyzeCropImageDeclaration,
  answerCropQuestionDeclaration,
  executeAnalyzeCropImage,
  executeAnswerCropQuestion,
} from './cropTool.ts';
import { getMandiPricesDeclaration, executeGetMandiPrices } from './mandiTool.ts';
import { findEligibleSchemesDeclaration, executeFindEligibleSchemes } from './schemesTool.ts';
import { navigateToPageDeclaration, executeNavigateToPage } from './navigationTool.ts';
import type { FarmerProfile } from '../../models/farmer.ts';
import { logger } from '../../utils/logger.ts';

export const ALL_TOOL_DECLARATIONS = [
  getWeatherDeclaration,
  getMandiPricesDeclaration,
  findEligibleSchemesDeclaration,
  analyzeCropImageDeclaration,
  answerCropQuestionDeclaration,
  navigateToPageDeclaration,
];

export async function dispatchToolCall(toolName: string, args: any, farmer?: FarmerProfile): Promise<any> {
  logger.info(`Executing tool: ${toolName}`, { args });

  switch (toolName) {
    case 'get_weather':
      return executeGetWeather(args, farmer);
    case 'get_mandi_prices':
      return executeGetMandiPrices(args, farmer);
    case 'find_eligible_schemes':
      return executeFindEligibleSchemes(args, farmer);
    case 'analyze_crop_image':
      return executeAnalyzeCropImage(args, farmer);
    case 'answer_crop_question':
      return executeAnswerCropQuestion(args, farmer);
    case 'navigate_to_page':
      return executeNavigateToPage(args);
    default:
      throw new Error(`Unrecognized tool name: ${toolName}`);
  }
}
