/**
 * KrishiMitra AI Assistant Intent & Orchestration Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assistantOrchestrator } from '../src/services/ai/assistantOrchestrator.ts';
import { db } from '../src/database/inMemoryDb.ts';

describe('KrishiMitra AI Assistant Intent & Orchestration Tests', () => {
  it('should correctly classify Weather Intent and propose /weather-advisory navigation', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Kya kal barish hogi? Sinchai karni chahiye ya nahi?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'weather');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/weather-advisory');
    assert.ok(res.data?.weather, 'Weather execution data should be populated');
  });

  it('should correctly classify Crop Disease Intent and propose /crop-advisory navigation', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Mere gehu ke patte peele pad rahe hain aur peela powder jhad raha hai',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'crop');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/crop-advisory');
  });

  it('Test 1: should correctly handle "मेरी फसल में कीड़े लग रहे हैं" -> crop intent and navigate to /crop-advisory', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'मेरी फसल में कीड़े लग रहे हैं',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'crop');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/crop-advisory');
    assert.equal(res.action.reason, 'Crop pest issue detected');
    assert.equal(res.message, 'आपकी फसल में कीट की समस्या हो सकती है। कृपया फसल की एक स्पष्ट फोटो अपलोड करें ताकि मैं उसका विश्लेषण कर सकूँ।');
    assert.notEqual(res.message, 'I have retrieved your agricultural details.');
  });

  it('Test 2: should correctly handle "कल बारिश होगी?" -> weather intent and navigate to /weather-advisory', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'कल बारिश होगी?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'weather');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/weather-advisory');
    assert.ok(res.data?.weather, 'Weather execution data should be present');
    assert.ok(res.message.includes('बारिश') || res.message.includes('तापमान'));
    assert.notEqual(res.message, 'I have retrieved your agricultural details.');
  });

  it('Test 3: should correctly handle "गेहूँ का भाव क्या है?" -> mandi intent and navigate to /mandi-intelligence', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'गेहूँ का भाव क्या है?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'mandi');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/mandi-intelligence');
    assert.ok(res.data?.mandi, 'Mandi execution data should be present');
    assert.notEqual(res.message, 'I have retrieved your agricultural details.');
  });

  it('Test 4: should correctly handle "मुझे कौन सी योजना मिलेगी?" -> schemes intent and navigate to /scheme-finder', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'मुझे कौन सी योजना मिलेगी?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'schemes');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/scheme-finder');
    assert.ok(res.data?.schemes, 'Schemes execution data should be present');
    assert.notEqual(res.message, 'I have retrieved your agricultural details.');
  });

  it('should correctly classify Mandi Price Intent and propose /mandi-intelligence navigation', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Aaj Lucknow mandi me gehu ka kya bhav chal raha hai?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'mandi');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/mandi-intelligence');
    assert.ok(res.data?.mandi, 'Mandi market intelligence data should be populated');
  });

  it('should correctly classify Government Scheme Intent and propose /scheme-finder navigation', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Mujhe drip irrigation lagani hai, kya koi sarkari subsidy milegi?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'schemes');
    assert.equal(res.action.type, 'navigate');
    assert.equal(res.action.page, '/scheme-finder');
    assert.ok(res.data?.schemes, 'RAG schemes data should be populated');
  });

  it('should correctly classify General Greeting Intent without navigation', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Namaste KrishiMitra, aap kya kar sakte hain?',
      farmerId: 'farmer-ramesh-kumar',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'general');
    assert.equal(res.action.type, 'none');
    assert.equal(res.action.page, null);
    assert.ok(res.message.length > 20);
  });

  it('should respond in English when farmer language preference is English', async () => {
    const res = await assistantOrchestrator.processRequest({
      message: 'Hello, what are your core features for farmers?',
      farmerId: 'farmer-balwinder-singh',
      pageContext: '/home',
    });

    assert.equal(res.intent, 'general');
    assert.ok(res.message.includes('Hello') || res.message.includes('KrishiMitra'));
  });
});
