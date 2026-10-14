/**
 * System Resilience & Graceful Degradation Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { weatherService } from '../src/services/weather/weatherService.ts';
import { mandiService } from '../src/services/mandi/mandiService.ts';
import { assistantOrchestrator } from '../src/services/ai/assistantOrchestrator.ts';
import { db } from '../src/database/inMemoryDb.ts';

describe('System Resilience & Graceful Degradation Test Suite', () => {
  it('weatherService: should return valid structured data even if custom location provided', async () => {
    const data = await weatherService.getWeather('UnknownState', 'UnknownDistrict');
    assert.ok(data);
    assert.ok(data.current.temp_c);
    assert.ok(data.forecast.length > 0);
  });

  it('mandiService: should gracefully return unavailable state without throwing or fabricating fake prices', async () => {
    const data = await mandiService.getMandiPrices({ crop: 'RareUnknownCrop', state: 'UnknownState', district: 'UnknownDistrict' });
    assert.ok(data);
    assert.equal(data.crop, 'RareUnknownCrop');
    assert.equal(data.is_available, false);
    assert.equal(data.modal_price, 0);
  });

  it('assistantOrchestrator: should gracefully produce valid response without throwing unhandled exceptions', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const res = await assistantOrchestrator.processRequest({
      message: 'Hello, how are you today?',
      farmerId: farmer.id,
    });

    assert.ok(res.message);
    assert.equal(res.intent, 'general');
    assert.ok(res.conversationId);
  });
});
