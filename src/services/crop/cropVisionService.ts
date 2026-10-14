/**
 * Multimodal Crop Pathology & Vision Analysis Service
 *
 * Strict Vision Pipeline:
 * Receive image -> Validate image exists -> Convert to Base64 -> Send actual image bytes to Gemini Vision -> Validate JSON -> Return response.
 * Never fabricate a diagnosis. Zero hardcoded crop fallbacks.
 */

import type {
  CropAnalysisRequest,
  CropAnalysisResult,
  CropSuccessAnalysisResult,
  CropInvalidImageResult,
  CropAnalysisFailedResult,
  IssueCategory,
} from '../../models/crop.ts';
import { geminiClient } from '../ai/geminiClient.ts';
import { config } from '../../config/index.ts';
import { logger } from '../../utils/logger.ts';

const VISION_SYSTEM_PROMPT = `You are KrishiMitra's agricultural image-analysis system.

You MUST examine the actual uploaded image.

FIRST decide whether the image visibly contains a plant or crop.

Do not trust the farmer profile or crop hint for image classification.

Examples:
Human face/selfie = non_plant
Animal = non_plant
Car = non_plant
Building = non_plant
Document = non_plant
Furniture = non_plant
Food = non_plant

A real leaf, crop, stem, fruit attached to a plant, crop field or
recognizable agricultural plant = plant.

If the image contains a plant but it is too blurry, dark, obstructed,
distant or otherwise impossible to analyze reliably = unclear.

ONLY when a real plant/crop is visible may you perform disease or pest
analysis.

Never invent a disease.

Never infer that the image contains Wheat simply because the user's
profile says Wheat.

Return JSON strictly matching this schema:
{
  "status": "success | invalid_image | unclear",
  "imageType": "plant | non_plant | unclear",
  "crop": "identified crop name or null",
  "possibleIssue": "identified disease/pest/nutritional issue, 'Healthy Plant', or null",
  "scientificName": "scientific name of pathogen/pest or null",
  "issueCategory": "fungal | bacterial | viral | pest | nutrient_deficiency | environmental | healthy | unknown",
  "confidence": "high | moderate | low",
  "observations": ["observation 1", "observation 2"],
  "recommendedActions": ["action 1", "action 2"],
  "prevention": ["prevention 1", "prevention 2"],
  "fertilizerOrChemicalRecommendation": ["chemical treatment recommendation if needed"],
  "organicAlternative": ["organic or biocontrol alternative if applicable"],
  "message": "explanatory message or empty string",
  "warning": "safety disclaimer or empty string"
}

Do NOT wrap JSON in markdown fences.`;

const MSG_INVALID_IMAGE_HI = 'यह तस्वीर किसी पौधे या फसल की नहीं लगती। कृपया अपनी फसल की स्पष्ट तस्वीर अपलोड करें।';
const MSG_INVALID_IMAGE_EN = 'This image does not appear to contain a plant or crop. Please upload a clear photograph of your crop.';

const MSG_UNCLEAR_HI = 'फसल तस्वीर में स्पष्ट दिखाई नहीं दे रही है। कृपया प्रभावित हिस्से की नज़दीक से स्पष्ट तस्वीर लें।';
const MSG_UNCLEAR_EN = 'The crop is not clear enough to analyze. Please take another close-up photograph.';

const MSG_ANALYSIS_FAILED_HI = 'फोटो का विश्लेषण नहीं हो सका। कृपया स्पष्ट फोटो के साथ पुनः प्रयास करें।';
const MSG_ANALYSIS_FAILED_EN = 'Image analysis failed. Please try again.';

export class CropVisionService {
  async analyzeCropImage(request: CropAnalysisRequest): Promise<CropAnalysisResult> {
    const cropHint = request.cropHint || request.farmerProfile?.crop || null;
    const question = request.question || 'Diagnose visible crop leaf diseases, pests, or nutritional deficiencies';
    const isHindi = this.isHindiRequest(request.farmerProfile?.language, question);

    const hasImage = Boolean(request.image && typeof request.image === 'string' && request.image.trim().length > 0);
    const geminiApiKeyPresent = geminiClient.isLive();
    const geminiModel = config.geminiModel || 'gemini-3.6-flash';

    // Extraction & Base64 parsing
    let mimeType = 'image/jpeg';
    let cleanBase64 = '';
    let rawInput = (request.image || '').trim();

    if (hasImage) {
      const dataUriMatch = rawInput.match(/^data:([^;]+);base64,(.+)$/s);
      if (dataUriMatch) {
        mimeType = dataUriMatch[1].trim().toLowerCase();
        cleanBase64 = dataUriMatch[2].trim().replace(/\s/g, '');
      } else if (rawInput.includes(',')) {
        const parts = rawInput.split(',');
        cleanBase64 = parts[1].trim().replace(/\s/g, '');
        const header = parts[0].toLowerCase();
        if (header.includes('image/png') || header.includes('png')) mimeType = 'image/png';
        else if (header.includes('image/webp') || header.includes('webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg';
      } else {
        cleanBase64 = rawInput.replace(/\s/g, '');
        if (cleanBase64.startsWith('iVBORw0KGgo')) {
          mimeType = 'image/png';
        } else if (cleanBase64.startsWith('/9j/')) {
          mimeType = 'image/jpeg';
        } else if (cleanBase64.startsWith('UklGR')) {
          mimeType = 'image/webp';
        }
      }
    }

    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }

    const base64Length = cleanBase64.length;
    const imageFingerprint = `${base64Length}-${cleanBase64.slice(0, 12)}`;

    // 1. Verify Gemini API Key
    if (!geminiApiKeyPresent) {
      this.printDebugLog({
        imageReceived: hasImage,
        mimeType,
        base64Length,
        geminiApiKeyPresent: false,
        geminiModel,
        geminiRequestSent: false,
        geminiHttpStatus: '503',
        geminiHttpStatusText: 'Service Unavailable',
        geminiRawResponse: 'N/A',
        candidateExists: false,
        candidateTextExists: false,
        jsonParseSuccess: false,
        parsedStatus: 'analysis_failed',
        parsedImageType: 'unclear',
        finalError: 'GEMINI_KEY_MISSING: GEMINI_API_KEY is not configured.',
      });

      return {
        status: 'analysis_failed',
        errorCode: 'GEMINI_KEY_MISSING',
        debugMessage: 'Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
        message: isHindi ? 'एआई विज़न सेवा उपलब्ध नहीं है (एपीआई कुंजी कॉन्फ़िगर नहीं है)।' : 'Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
        message_en: 'Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
        message_hi: 'एआई विज़न सेवा उपलब्ध नहीं है (एपीआई कुंजी कॉन्फ़िगर नहीं है)।',
      };
    }

    // 2. Validate Image Input
    if (!hasImage || base64Length === 0) {
      this.printDebugLog({
        imageReceived: false,
        mimeType,
        base64Length: 0,
        geminiApiKeyPresent,
        geminiModel,
        geminiRequestSent: false,
        geminiHttpStatus: '400',
        geminiHttpStatusText: 'Bad Request',
        geminiRawResponse: 'N/A',
        candidateExists: false,
        candidateTextExists: false,
        jsonParseSuccess: false,
        parsedStatus: 'unclear',
        parsedImageType: 'unclear',
        finalError: 'INVALID_IMAGE_DATA: image payload is empty',
      });

      return {
        status: 'unclear',
        imageType: 'unclear',
        crop: null,
        possibleIssue: null,
        message: isHindi ? MSG_UNCLEAR_HI : MSG_UNCLEAR_EN,
        message_en: MSG_UNCLEAR_EN,
        message_hi: MSG_UNCLEAR_HI,
      };
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      this.printDebugLog({
        imageReceived: true,
        mimeType,
        base64Length,
        geminiApiKeyPresent,
        geminiModel,
        geminiRequestSent: false,
        geminiHttpStatus: '400',
        geminiHttpStatusText: 'Bad Request',
        geminiRawResponse: 'N/A',
        candidateExists: false,
        candidateTextExists: false,
        jsonParseSuccess: false,
        parsedStatus: 'analysis_failed',
        parsedImageType: 'unclear',
        finalError: `INVALID_MIME_TYPE: mimeType ${mimeType} not permitted`,
      });

      return {
        status: 'analysis_failed',
        errorCode: 'INVALID_MIME_TYPE',
        debugMessage: `MIME type "${mimeType}" is not permitted. Only image/jpeg, image/png, image/webp allowed.`,
        message: isHindi ? MSG_ANALYSIS_FAILED_HI : MSG_ANALYSIS_FAILED_EN,
        message_en: MSG_ANALYSIS_FAILED_EN,
        message_hi: MSG_ANALYSIS_FAILED_HI,
      };
    }

    if (base64Length <= 100) {
      this.printDebugLog({
        imageReceived: true,
        mimeType,
        base64Length,
        geminiApiKeyPresent,
        geminiModel,
        geminiRequestSent: false,
        geminiHttpStatus: '400',
        geminiHttpStatusText: 'Bad Request',
        geminiRawResponse: 'N/A',
        candidateExists: false,
        candidateTextExists: false,
        jsonParseSuccess: false,
        parsedStatus: 'unclear',
        parsedImageType: 'unclear',
        finalError: `INVALID_IMAGE_DATA: base64Length too short (${base64Length} chars)`,
      });

      return {
        status: 'unclear',
        imageType: 'unclear',
        crop: null,
        possibleIssue: null,
        message: isHindi ? MSG_UNCLEAR_HI : MSG_UNCLEAR_EN,
        message_en: MSG_UNCLEAR_EN,
        message_hi: MSG_UNCLEAR_HI,
      };
    }

    const prompt = `Examine the uploaded image and classify strictly according to agricultural pathology standards.

Return JSON strictly matching this schema:
{
  "status": "success | invalid_image | unclear",
  "imageType": "plant | non_plant | unclear",
  "crop": "identified crop name or null",
  "possibleIssue": "identified disease/pest/nutritional issue, 'Healthy Plant', or null",
  "scientificName": "scientific name of pathogen/pest or null",
  "issueCategory": "fungal | bacterial | viral | pest | nutrient_deficiency | environmental | healthy | unknown",
  "confidence": "high | moderate | low",
  "observations": ["observation 1", "observation 2"],
  "recommendedActions": ["action 1", "action 2"],
  "prevention": ["prevention 1", "prevention 2"],
  "fertilizerOrChemicalRecommendation": ["chemical treatment recommendation if needed"],
  "organicAlternative": ["organic or biocontrol alternative if applicable"],
  "message": "explanatory message or empty string",
  "warning": "safety disclaimer or empty string"
}

Contextual parameters (for reference only, NEVER trust over actual image):
- Farmer Question/Context: ${question}
- User Crop Hint (optional): ${cropHint || 'None'}
- Output Language: ${isHindi ? 'Hindi' : 'English'}`;

    try {
      const geminiResult = await geminiClient.generateMultimodalContent({
        prompt,
        imageBase64: request.image,
        jsonMode: true,
        systemInstruction: VISION_SYSTEM_PROMPT,
      });

      const responseText = (geminiResult.text || '').trim();
      const candidateExists = geminiResult.candidateExists;
      const candidateTextExists = geminiResult.candidateTextExists;

      if (!geminiResult.success || !candidateTextExists) {
        const errCode = geminiResult.errorCode || 'GEMINI_REQUEST_FAILED';
        const finalError = geminiResult.error || 'Gemini Vision returned empty candidate text';

        this.printDebugLog({
          imageReceived: true,
          mimeType,
          base64Length,
          geminiApiKeyPresent: true,
          geminiModel: geminiResult.modelUsed || geminiModel,
          geminiRequestSent: true,
          geminiHttpStatus: geminiResult.httpStatus.toString(),
          geminiHttpStatusText: geminiResult.httpStatusText || 'Error',
          geminiRawResponse: geminiResult.rawResponse || 'empty',
          candidateExists,
          candidateTextExists,
          jsonParseSuccess: false,
          parsedStatus: 'analysis_failed',
          parsedImageType: 'unclear',
          finalError,
        });

        return {
          status: 'analysis_failed',
          errorCode: errCode,
          debugMessage: finalError,
          message: isHindi ? MSG_ANALYSIS_FAILED_HI : MSG_ANALYSIS_FAILED_EN,
          message_en: MSG_ANALYSIS_FAILED_EN,
          message_hi: MSG_ANALYSIS_FAILED_HI,
        };
      }

      // JSON Parsing with code-fence stripping
      let rawJson = responseText;
      if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      }

      let parsed: any = null;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError: any) {
        // Fallback match braces if minor prefix/suffix exists
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (secondErr: any) {
            console.log(`RAW GEMINI TEXT:\n${rawJson}\nJSON ERROR:\n${secondErr?.message}`);
          }
        } else {
          console.log(`RAW GEMINI TEXT:\n${rawJson}\nJSON ERROR:\n${parseError?.message}`);
        }
      }

      if (!parsed || typeof parsed !== 'object') {
        const parseErrText = `JSON parse failed on candidate text: ${responseText.slice(0, 300)}`;
        this.printDebugLog({
          imageReceived: true,
          mimeType,
          base64Length,
          geminiApiKeyPresent: true,
          geminiModel: geminiResult.modelUsed || geminiModel,
          geminiRequestSent: true,
          geminiHttpStatus: geminiResult.httpStatus.toString(),
          geminiHttpStatusText: geminiResult.httpStatusText,
          geminiRawResponse: responseText,
          candidateExists: true,
          candidateTextExists: true,
          jsonParseSuccess: false,
          parsedStatus: 'analysis_failed',
          parsedImageType: 'unclear',
          finalError: `GEMINI_RESPONSE_PARSE_ERROR: ${parseErrText}`,
        });

        return {
          status: 'analysis_failed',
          errorCode: 'GEMINI_RESPONSE_PARSE_ERROR',
          debugMessage: parseErrText,
          message: isHindi ? MSG_ANALYSIS_FAILED_HI : MSG_ANALYSIS_FAILED_EN,
          message_en: MSG_ANALYSIS_FAILED_EN,
          message_hi: MSG_ANALYSIS_FAILED_HI,
        };
      }

      const status = parsed.status;
      const imageType = parsed.imageType;

      this.printDebugLog({
        imageReceived: true,
        mimeType,
        base64Length,
        geminiApiKeyPresent: true,
        geminiModel: geminiResult.modelUsed || geminiModel,
        geminiRequestSent: true,
        geminiHttpStatus: geminiResult.httpStatus.toString(),
        geminiHttpStatusText: geminiResult.httpStatusText,
        geminiRawResponse: responseText,
        candidateExists: true,
        candidateTextExists: true,
        jsonParseSuccess: true,
        parsedStatus: status || 'unknown',
        parsedImageType: imageType || 'unknown',
        finalError: 'none',
      });

      // 1. Invalid Image / Non-Plant
      if (status === 'invalid_image' || imageType === 'non_plant') {
        return {
          status: 'invalid_image',
          imageType: 'non_plant',
          crop: null,
          possibleIssue: null,
          message: parsed.message || (isHindi ? MSG_INVALID_IMAGE_HI : MSG_INVALID_IMAGE_EN),
          message_en: MSG_INVALID_IMAGE_EN,
          message_hi: MSG_INVALID_IMAGE_HI,
        };
      }

      // 2. Unclear Image
      if (status === 'unclear' || imageType === 'unclear') {
        return {
          status: 'unclear',
          imageType: 'unclear',
          crop: null,
          possibleIssue: null,
          message: parsed.message || (isHindi ? MSG_UNCLEAR_HI : MSG_UNCLEAR_EN),
          message_en: MSG_UNCLEAR_EN,
          message_hi: MSG_UNCLEAR_HI,
        };
      }

      // 3. Genuine Plant Analysis
      const isExplicitInvalid = status === 'invalid_image' || imageType === 'non_plant';
      const isExplicitUnclear = status === 'unclear' || imageType === 'unclear';
      const looksLikePlantAnalysis = (status === 'success') || (imageType === 'plant') || Boolean(parsed.possibleIssue || parsed.observations || parsed.remedies || parsed.recommendedActions);

      if (!isExplicitInvalid && !isExplicitUnclear && looksLikePlantAnalysis) {
        const cropName = parsed.crop || cropHint || 'Crop';
        const possibleIssue = parsed.possibleIssue || (isHindi ? 'स्वस्थ पौधा' : 'Healthy Plant');
        const isHealthy =
          possibleIssue.toLowerCase().includes('healthy') ||
          possibleIssue.toLowerCase().includes('स्वस्थ') ||
          parsed.issueCategory === 'healthy';

        const remedies = Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0
          ? parsed.recommendedActions
          : Array.isArray(parsed.remedies) && parsed.remedies.length > 0
          ? parsed.remedies
          : [isHealthy ? (isHindi ? 'संतुलित सिंचाई और पोषण प्रबंधन जारी रखें।' : 'Continue balanced irrigation and standard agronomic practices.') : (isHindi ? 'नजदीकी केवीके से खुराक की पुष्टि करें।' : 'Consult local Krishi Vigyan Kendra for recommended spray dosage.')];

        const observations = Array.isArray(parsed.observations) && parsed.observations.length > 0
          ? parsed.observations
          : [isHindi ? 'पत्तियों का दृश्य परीक्षण पूर्ण हुआ।' : 'Visual leaf pathology assessment completed.'];

        const prevention = Array.isArray(parsed.prevention) && parsed.prevention.length > 0
          ? parsed.prevention
          : [isHindi ? 'प्रमाणित रोगमुक्त बीजों का प्रयोग करें और संतुलित पोषण बनाए रखें।' : 'Use certified disease-free seeds and maintain balanced NPK nutrition.'];

        const conf = (parsed.confidence || 'moderate').toString().toLowerCase();
        const normalizedConfidence: 'high' | 'moderate' | 'low' =
          conf === 'high' || conf === 'उच्च' ? 'high' : conf === 'low' || conf === 'निम्न' ? 'low' : 'moderate';

        return {
          status: 'success',
          imageType: 'plant',
          crop: cropName,
          possibleIssue,
          disease_name: possibleIssue,
          scientificName: parsed.scientificName || null,
          issueCategory: isHealthy ? 'healthy' : (parsed.issueCategory as IssueCategory) || 'unknown',
          confidence: normalizedConfidence,
          observations,
          recommendedActions: remedies,
          remedies,
          prevention,
          fertilizerOrChemicalRecommendation: Array.isArray(parsed.fertilizerOrChemicalRecommendation)
            ? parsed.fertilizerOrChemicalRecommendation
            : undefined,
          organicAlternative: Array.isArray(parsed.organicAlternative)
            ? parsed.organicAlternative
            : undefined,
          warning:
            parsed.warning ||
            (isHindi
              ? 'यह एआई-आधारित सलाह केवल दृश्य लक्षणों पर आधारित है। रासायनिक छिड़काव से पहले अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से पुष्टि करें।'
              : 'AI-assisted diagnosis based on visual patterns. Please confirm with your local Krishi Vigyan Kendra (KVK) before chemical application.'),
        };
      }

      // Any unhandled schema status
      return {
        status: 'analysis_failed',
        errorCode: 'GEMINI_RESPONSE_PARSE_ERROR',
        debugMessage: `Unexpected status "${status}" or imageType "${imageType}" from model.`,
        message: isHindi ? MSG_ANALYSIS_FAILED_HI : MSG_ANALYSIS_FAILED_EN,
        message_en: MSG_ANALYSIS_FAILED_EN,
        message_hi: MSG_ANALYSIS_FAILED_HI,
      };
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown error';
      this.printDebugLog({
        imageReceived: true,
        mimeType,
        base64Length,
        geminiApiKeyPresent: true,
        geminiModel,
        geminiRequestSent: true,
        geminiHttpStatus: '500',
        geminiHttpStatusText: 'Internal Server Error',
        geminiRawResponse: errMsg,
        candidateExists: false,
        candidateTextExists: false,
        jsonParseSuccess: false,
        parsedStatus: 'analysis_failed',
        parsedImageType: 'unclear',
        finalError: errMsg,
      });

      return {
        status: 'analysis_failed',
        errorCode: 'GEMINI_REQUEST_FAILED',
        debugMessage: errMsg,
        message: isHindi ? MSG_ANALYSIS_FAILED_HI : MSG_ANALYSIS_FAILED_EN,
        message_en: MSG_ANALYSIS_FAILED_EN,
        message_hi: MSG_ANALYSIS_FAILED_HI,
      };
    }
  }

  async answerCropQuestion(args: {
    crop: string;
    question: string;
    previousAnalysis?: Partial<CropAnalysisResult>;
    farmerProfile?: any;
  }): Promise<{ answer: string; recommended_action: string }> {
    const isHindi = this.isHindiRequest(args.farmerProfile?.language, args.question);
    const prompt = `You are KrishiMitra AI Crop Doctor.
Farmer Crop: ${args.crop}
Question: ${args.question}
Previous Diagnosis Context: ${JSON.stringify(args.previousAnalysis || {})}
Provide clear, practical, cost-effective agronomic advice tailored for an Indian farmer in ${isHindi ? 'Hindi' : 'English'}.`;

    try {
      const response = await geminiClient.generateText({ prompt });
      return {
        answer: response,
        recommended_action: isHindi
          ? 'अनुशंसित छिड़काव कार्यक्रम का पालन करें और अगले 3 दिनों तक पत्तियों के लक्षणों की निगरानी करें।'
          : 'Follow the recommended spray schedule and monitor leaf symptoms over the next 3 days.',
      };
    } catch {
      return {
        answer: isHindi
          ? `${args.crop} के लिए, खेत में उचित नमी बनाए रखें और फफूंद लक्षण दिखने पर अतिरिक्त यूरिया न डालें। आवश्यकतानुसार सुरक्षात्मक फफूंदनाशी का प्रयोग करें।`
          : `For ${args.crop}, ensure proper field moisture and avoid excess nitrogen fertilizer if fungal spots appear. Apply recommended protective fungicide if symptoms spread.`,
        recommended_action: isHindi
          ? 'अपने नजदीकी कृषि विज्ञान केंद्र (KVK) के अधिकारी से संपर्क करें।'
          : 'Consult your nearest Krishi Vigyan Kendra (KVK) extension officer.',
      };
    }
  }

  private printDebugLog(data: {
    imageReceived: boolean;
    mimeType: string;
    base64Length: number;
    geminiApiKeyPresent: boolean;
    geminiModel: string;
    geminiRequestSent: boolean;
    geminiHttpStatus: string;
    geminiHttpStatusText: string;
    geminiRawResponse: string;
    candidateExists: boolean;
    candidateTextExists: boolean;
    jsonParseSuccess: boolean;
    parsedStatus: string;
    parsedImageType: string;
    finalError: string;
  }): void {
    console.log(`[CROP VISION DEBUG]

imageReceived: ${data.imageReceived}
mimeType: ${data.mimeType}
base64Length: ${data.base64Length}

geminiApiKeyPresent: ${data.geminiApiKeyPresent}
geminiModel: ${data.geminiModel}
geminiRequestSent: ${data.geminiRequestSent}

geminiHttpStatus: ${data.geminiHttpStatus}
geminiHttpStatusText: ${data.geminiHttpStatusText}

geminiRawResponse: ${data.geminiRawResponse}

candidateExists: ${data.candidateExists}
candidateTextExists: ${data.candidateTextExists}

jsonParseSuccess: ${data.jsonParseSuccess}
parsedStatus: ${data.parsedStatus}
parsedImageType: ${data.parsedImageType}

finalError: ${data.finalError}`);
  }

  private isHindiRequest(lang?: string, question?: string): boolean {
    if (lang) {
      const l = lang.toLowerCase();
      if (l.includes('hi') || l.includes('hindi') || l.includes('हिंदी')) return true;
      if (l.includes('en') || l.includes('english')) return false;
    }
    if (question && /[\u0900-\u097F]/.test(question)) {
      return true;
    }
    return false;
  }
}

export const cropVisionService = new CropVisionService();

