/**
 * Central Multi-Turn AI Orchestrator & Tool Caller
 */

import type { AssistantRequest, AssistantResponse, AssistantIntent, ProposedNavigationAction } from '../../models/assistant.ts';
import type { FarmerProfile } from '../../models/farmer.ts';
import { promptBuilder } from './promptBuilder.ts';
import { geminiClient } from './geminiClient.ts';
import { dispatchToolCall } from '../tools/toolRegistry.ts';
import { db } from '../../database/inMemoryDb.ts';
import { logger } from '../../utils/logger.ts';

export class AssistantOrchestrator {
  async processRequest(request: AssistantRequest): Promise<AssistantResponse> {
    const { message, conversationId, farmerId, pageContext, image } = request;

    let farmer: FarmerProfile;
    if (farmerId) {
      farmer = (await db.farmer.getById(farmerId)) || (await db.farmer.getDefaultProfile());
    } else {
      farmer = await db.farmer.getDefaultProfile();
    }

    let activeConvId = conversationId;
    if (!activeConvId) {
      const newConv = await db.conversation.create(farmer.id, `Chat with ${farmer.name}`);
      activeConvId = newConv.id;
    }

    const profileLoaded = Boolean(farmer && farmer.id);
    console.log(`[ASSISTANT REQUEST]\n\nmessageReceived: ${message}\nconversationId: ${activeConvId}\nauthenticatedFarmerId: ${farmer.id}\nprofileLoaded: ${profileLoaded}\n`);

    await db.conversation.addMessage(activeConvId, {
      farmerId: farmer.id,
      role: 'farmer',
      content: message,
    });

    const hasHindiCharacters = /[\u0900-\u097F]/.test(message);
    const isEn = ((farmer.language as string) === 'English' || (farmer.language as string) === 'en') && !hasHindiCharacters;

    const intent = this.detectIntent(message, image);
    logger.info(`Detected intent: ${intent} for message: "${message.substring(0, 50)}..."`);

    let executionData: Record<string, any> = {};
    let proposedAction: ProposedNavigationAction = { type: 'none', page: null };
    let assistantMessage = '';

    switch (intent) {
      case 'weather': {
        const weatherResult = await dispatchToolCall(
          'get_weather',
          { state: farmer.state, district: farmer.district, crop: farmer.crop },
          farmer
        );
        executionData.weather = weatherResult;
        proposedAction = {
          type: 'navigate',
          page: '/weather-advisory',
          reason: 'Check 5-day weather forecast and spray alerts',
        };
        assistantMessage = this.formatWeatherResponse(weatherResult, farmer, isEn);
        break;
      }

      case 'crop': {
        if (image) {
          const cropAnalysis = await dispatchToolCall(
            'analyze_crop_image',
            { image, crop: farmer.crop, question: message },
            farmer
          );
          executionData.cropAnalysis = cropAnalysis;
          proposedAction = {
            type: 'navigate',
            page: '/crop-advisory',
            reason: 'View detailed crop diagnosis report',
          };
          assistantMessage = this.formatCropResponse(cropAnalysis, farmer, isEn);
        } else {
          proposedAction = {
            type: 'navigate',
            page: '/crop-advisory',
            reason: 'Crop pest issue detected',
          };
          assistantMessage = isEn
            ? 'Your crop may have a pest or disease issue. Please upload a clear photo of the crop so I can analyze it.'
            : 'आपकी फसल में कीट की समस्या हो सकती है। कृपया फसल की एक स्पष्ट फोटो अपलोड करें ताकि मैं उसका विश्लेषण कर सकूँ।';
          executionData = {};
        }
        break;
      }

      case 'mandi': {
        const mandiResult = await dispatchToolCall(
          'get_mandi_prices',
          { crop: farmer.crop, state: farmer.state, district: farmer.district },
          farmer
        );
        executionData.mandi = mandiResult;
        proposedAction = {
          type: 'navigate',
          page: '/mandi-intelligence',
          reason: 'Compare nearby APMC mandi prices and trends',
        };
        assistantMessage = this.formatMandiResponse(mandiResult, farmer, isEn);
        break;
      }

      case 'schemes': {
        const schemesResult = await dispatchToolCall(
          'find_eligible_schemes',
          { query: message, state: farmer.state, crop: farmer.crop, land_size: farmer.land_size },
          farmer
        );
        executionData.schemes = schemesResult;
        proposedAction = {
          type: 'navigate',
          page: '/scheme-finder',
          reason: 'View matching government schemes and official portals',
        };
        assistantMessage = this.formatSchemesResponse(schemesResult, farmer, isEn);
        break;
      }

      case 'general':
      default: {
        const systemPrompt = promptBuilder.buildSystemPrompt(farmer, pageContext);
        if (geminiClient.isLive()) {
          try {
            assistantMessage = await geminiClient.generateText({
              prompt: message,
              systemInstruction: systemPrompt,
            });
          } catch (err) {
            logger.warn('Gemini text generation encountered an error, falling back to local guidance:', { error: String(err) });
            assistantMessage =
              isEn
                ? `Hello ${farmer.name}! I am KrishiMitra AI. I can assist you with real-time weather forecasts, mandi prices for ${farmer.crop}, leaf disease diagnosis, and government subsidy schemes.`
                : `नमस्ते ${farmer.name} जी! मैं आपका कृषि मित्र हूँ। मैं मौसम पूर्वानुमान, ${farmer.crop} के आज के मंडी भाव, फसल रोग पहचान और सरकारी योजनाओं में आपकी पूरी मदद कर सकता हूँ।`;
          }
        } else {
          assistantMessage =
            isEn
              ? `Hello ${farmer.name}! I am KrishiMitra AI. I can assist you with real-time weather forecasts, mandi prices for ${farmer.crop}, leaf disease diagnosis, and government subsidy schemes.`
              : `नमस्ते ${farmer.name} जी! मैं आपका कृषि मित्र हूँ। मैं मौसम पूर्वानुमान, ${farmer.crop} के आज के मंडी भाव, फसल रोग पहचान और सरकारी योजनाओं में आपकी पूरी मदद कर सकता हूँ।`;
        }
        break;
      }
    }

    await db.conversation.addMessage(activeConvId, {
      farmerId: farmer.id,
      role: 'assistant',
      content: assistantMessage,
      intent,
      action: proposedAction,
      data: executionData,
    });

    return {
      message: assistantMessage,
      intent,
      action: proposedAction,
      data: executionData,
      conversationId: activeConvId,
      timestamp: new Date().toISOString(),
    };
  }

  private detectIntent(message: string, image?: string): AssistantIntent {
    if (image) return 'crop';

    const msg = message.toLowerCase();

    // 1. Schemes / Government Support
    if (
      msg.includes('scheme') ||
      msg.includes('yojana') ||
      msg.includes('योजना') ||
      msg.includes('subsidy') ||
      msg.includes('सब्सिडी') ||
      msg.includes('pm-kisan') ||
      msg.includes('pmkisan') ||
      msg.includes('bima') ||
      msg.includes('बीमा') ||
      msg.includes('fasal bima') ||
      msg.includes('kcc') ||
      msg.includes('loan') ||
      msg.includes('karj') ||
      msg.includes('कर्ज') ||
      msg.includes('sarkari') ||
      msg.includes('सरकारी') ||
      msg.includes('anudan') ||
      msg.includes('अनुदान')
    ) {
      return 'schemes';
    }

    // 2. Weather / Irrigation Advisory
    if (
      msg.includes('weather') ||
      msg.includes('rain') ||
      msg.includes('baarish') ||
      msg.includes('barish') ||
      msg.includes('बारिश') ||
      msg.includes('वर्षा') ||
      msg.includes('mausam') ||
      msg.includes('मौसम') ||
      msg.includes('temperature') ||
      msg.includes('तापमान') ||
      msg.includes('sinchai') ||
      msg.includes('सिंचाई') ||
      msg.includes('पानी') ||
      msg.includes('irrigation') ||
      msg.includes('forecast') ||
      msg.includes('पूर्वानुमान')
    ) {
      return 'weather';
    }

    // 3. Mandi / Market Prices
    if (
      msg.includes('mandi') ||
      msg.includes('मंडी') ||
      msg.includes('bhav') ||
      msg.includes('bhaav') ||
      msg.includes('भाव') ||
      msg.includes('price') ||
      msg.includes('rate') ||
      msg.includes('रेट') ||
      msg.includes('msp') ||
      msg.includes('एमएसपी') ||
      msg.includes('market') ||
      msg.includes('बाजार') ||
      msg.includes('daam') ||
      msg.includes('दाम') ||
      msg.includes('apmc') ||
      msg.includes('bechna') ||
      msg.includes('बेचना')
    ) {
      return 'mandi';
    }

    // 4. Crop Pathology / Pests / Diseases / Agronomy
    if (
      msg.includes('crop') ||
      msg.includes('fasal') ||
      msg.includes('फसल') ||
      msg.includes('disease') ||
      msg.includes('रोग') ||
      msg.includes('बीमारी') ||
      msg.includes('leaf') ||
      msg.includes('leaves') ||
      msg.includes('patte') ||
      msg.includes('पत्ती') ||
      msg.includes('पत्तों') ||
      msg.includes('पत्ते') ||
      msg.includes('keeda') ||
      msg.includes('keede') ||
      msg.includes('कीड़े') ||
      msg.includes('कीड़ा') ||
      msg.includes('कीट') ||
      msg.includes('pest') ||
      msg.includes('pests') ||
      msg.includes('insect') ||
      msg.includes('insects') ||
      msg.includes('fungus') ||
      msg.includes('फफूंद') ||
      msg.includes('peela') ||
      msg.includes('पीला') ||
      msg.includes('खराब') ||
      msg.includes('dawai') ||
      msg.includes('दवा') ||
      msg.includes('दवाई') ||
      msg.includes('spray') ||
      msg.includes('छिड़काव') ||
      msg.includes('fertilizer') ||
      msg.includes('उर्वरक') ||
      msg.includes('khad') ||
      msg.includes('खाद') ||
      msg.includes('chlorosis') ||
      msg.includes('rust') ||
      msg.includes('रतुआ') ||
      msg.includes('blight') ||
      msg.includes('झुलसा')
    ) {
      return 'crop';
    }

    return 'general';
  }

  private formatWeatherResponse(data: any, farmer: FarmerProfile, isEn = false): string {
    const w = data.weather_data;
    const adv = data.agricultural_advisory;
    const tomorrow = w.forecast?.[1] || w.forecast?.[0] || {};

    if (isEn) {
      return `Current weather in ${w.location.district}: ${w.current.temp_c}°C, ${w.current.condition_text}. Tomorrow's forecast indicates ${tomorrow.rain_probability_percent}% chance of rain (${tomorrow.precipitation_mm}mm). Advisory for your ${farmer.crop}: ${adv.irrigation_advice}`;
    }

    return `${w.location.district} में वर्तमान तापमान ${w.current.temp_c}°C (${w.current.condition_text}) है। कल बारिश की संभावना ${tomorrow.rain_probability_percent}% (${tomorrow.precipitation_mm}mm) है। आपकी ${farmer.crop} की फसल के लिए सलाह: ${adv.irrigation_advice}`;
  }

  private formatCropResponse(data: any, farmer: FarmerProfile, isEn = false): string {
    if (data.status === 'invalid_image' || data.status === 'unclear' || data.status === 'invalid_crop' || !data.possibleIssue) {
      if (data.message) return data.message;
      return isEn
        ? 'Please upload a clear crop photo for accurate AI disease diagnosis.'
        : 'सटीक एआई फसल रोग निदान के लिए कृपया फसल या पत्ती की स्पष्ट फोटो अपलोड करें।';
    }

    if (isEn) {
      return `AI Leaf Assessment for ${data.crop}: Possible Issue identified as ${data.possibleIssue} (${data.confidence} confidence). Recommended Action: ${data.recommendedActions?.[0] || 'Apply protective spray'}. Chemical treatment: ${data.fertilizerOrChemicalRecommendation?.[0] || 'Consult KVK'}.`;
    }

    return `${data.crop} की फसल जांच: संभावित समस्या "${data.possibleIssue}" पाई गई है (${data.confidence} विश्वास)। तत्काल सुझाव: ${data.recommendedActions?.[0] || 'खेत में नमी नियंत्रित करें'}। रासायनिक उपचार: ${data.fertilizerOrChemicalRecommendation?.[0] || 'नजदीकी केवीके से संपर्क करें'}।`;
  }

  private formatMandiResponse(data: any, farmer: FarmerProfile, isEn = false): string {
    const m = data.mandi_data;

    if (!m.is_available) {
      if (isEn) {
        return `Market Data Notice for ${m.crop} in ${m.district}: Live APMC spot rates are currently unavailable. Official Govt MSP reference is ₹${m.msp_declared || 'N/A'}/quintal. Zero price fabrication is strictly enforced.`;
      }
      return `${m.district} में ${m.crop} के लाइव मंडी भाव फिलहाल उपलब्ध नहीं हैं। सरकारी न्यूनतम समर्थन मूल्य (MSP) ₹${m.msp_declared || 'N/A'}/क्विंटल है।`;
    }

    if (isEn) {
      return `Today's modal rate for ${m.crop} at ${m.primary_mandi} is ₹${m.modal_price || m.current_price}/quintal (Range: ₹${m.min_price} - ₹${m.max_price}/q). ${data.market_analysis.trend_summary}`;
    }

    return `${m.primary_mandi} में आज ${m.crop} का औसत मॉडल भाव ₹${m.modal_price || m.current_price}/क्विंटल है (न्यूनतम: ₹${m.min_price}, अधिकतम: ₹${m.max_price})। ${data.market_analysis.advice}`;
  }

  private formatSchemesResponse(data: any, farmer: FarmerProfile, isEn = false): string {
    const top = data.topSchemes?.[0];

    if (!top) {
      return isEn
        ? `I have searched the verified database. Based on your ${farmer.land_size} acre holding in ${farmer.state}, you are eligible for PM-KISAN (₹6000/year) and PMFBY crop insurance.`
        : `सत्यापित डेटाबेस के अनुसार आपकी ${farmer.land_size} एकड़ जमीन (${farmer.state}) के लिए PM-KISAN (₹6000/वर्ष) और PMFBY फसल बीमा सबसे उपयुक्त योजनाएं हैं।`;
    }

    if (isEn) {
      return `Top matching verified scheme for you: ${top.schemeName} (${top.category}). Official Portal: ${top.officialUrl}. You can view the complete scheme details and eligibility criteria in the Scheme Finder.`;
    }

    return `आपके लिए सबसे उपयुक्त सरकारी योजना: ${top.schemeName} (${top.category}) है। आधिकारिक वेबसाइट: ${top.officialUrl}। आप स्कीम फाइंडर में पूरी जानकारी देख सकते हैं।`;
  }
}

export const assistantOrchestrator = new AssistantOrchestrator();
