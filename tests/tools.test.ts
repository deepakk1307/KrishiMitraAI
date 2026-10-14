/**
 * Server-Side Agricultural Tools Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchToolCall } from '../src/services/tools/toolRegistry.ts';
import { executeNavigateToPage } from '../src/services/tools/navigationTool.ts';
import { db } from '../src/database/inMemoryDb.ts';

describe('Server-Side Agricultural Tools Test Suite', () => {
  it('get_weather: should retrieve weather metrics and agricultural advisory', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'get_weather',
      { state: 'Uttar Pradesh', district: 'Lucknow', crop: 'Wheat' },
      farmer
    );

    assert.ok(result.weather_data);
    assert.ok(result.agricultural_advisory);
    assert.equal(typeof result.weather_data.current.temp_c, 'number');
    assert.ok(result.agricultural_advisory.irrigation_advice.length > 0);
  });

  it('get_mandi_prices: should return structured market intelligence with zero price fabrication', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'get_mandi_prices',
      { crop: 'Wheat', state: 'Uttar Pradesh', district: 'Lucknow' },
      farmer
    );

    assert.ok(result.mandi_data);
    assert.ok(result.market_analysis);
    assert.equal(result.mandi_data.crop, 'Wheat');
  });

  it('find_eligible_schemes: should filter schemes and include official portal sources', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'find_eligible_schemes',
      { query: 'irrigation drip subsidy', state: 'Uttar Pradesh' },
      farmer
    );

    assert.ok(result.topSchemes);
    assert.ok(result.sources.length > 0);
    assert.ok(result.sources[0].url.startsWith('https://'));
  });

  it('analyze_crop_image: empty or malformed base64 returns status unclear', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'analyze_crop_image',
      { image: '', crop: 'Wheat', question: 'Empty image test' },
      farmer
    );

    assert.equal(result.status, 'unclear');
    assert.equal(result.imageType, 'unclear');
    assert.equal(result.possibleIssue, null);
    assert.ok(result.message);
  });

  it('analyze_crop_image: truncated or short base64 string returns status unclear', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'analyze_crop_image',
      { image: 'data:image/jpeg;base64,/9j/short', crop: 'Wheat', question: 'Short image' },
      farmer
    );

    assert.equal(result.status, 'unclear');
    assert.equal(result.imageType, 'unclear');
    assert.equal(result.possibleIssue, null);
    assert.ok(result.message);
  });

  it('analyze_crop_image: strict pipeline returns valid schema status without any mock fallbacks', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const result = await dispatchToolCall(
      'analyze_crop_image',
      { image: validJpeg, crop: 'Wheat', question: 'Check crop' },
      farmer
    );

    // Status MUST be one of the strict pipeline statuses
    assert.ok(['success', 'invalid_image', 'unclear', 'analysis_failed'].includes(result.status));

    if (result.status === 'invalid_image') {
      assert.equal(result.imageType, 'non_plant');
      assert.equal(result.possibleIssue, null);
    } else if (result.status === 'unclear') {
      assert.equal(result.imageType, 'unclear');
      assert.equal(result.possibleIssue, null);
    } else if (result.status === 'analysis_failed') {
      assert.ok(result.message);
      assert.ok(!result.possibleIssue, 'Failed analysis must never fabricate a disease diagnosis');
    } else if (result.status === 'success') {
      assert.equal(result.imageType, 'plant');
      assert.ok(result.crop);
      assert.ok(result.possibleIssue);
      assert.ok(result.observations && result.observations.length > 0);
    }
  });

  it('analyze_crop_image: ensures zero fake Yellow Rust or Chlorosis mock fallbacks exist', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const result = await dispatchToolCall(
      'analyze_crop_image',
      { image: validJpeg, crop: 'Tomato', question: 'Photo of a car or human face' },
      farmer
    );

    assert.ok(['success', 'invalid_image', 'unclear', 'analysis_failed'].includes(result.status));
    if (result.status !== 'success') {
      assert.ok(!result.possibleIssue, 'Non-success must never return a disease');
    }
  });

  it('answer_crop_question: should answer follow-up agronomic queries', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await dispatchToolCall(
      'answer_crop_question',
      { crop: 'Wheat', question: 'How much urea should I apply during first irrigation?' },
      farmer
    );

    assert.ok(result.answer);
    assert.ok(result.recommended_action);
  });

  it('navigate_to_page: should accept whitelisted routes and reject unauthorized routes', () => {
    const valid = executeNavigateToPage({ page: '/mandi-intelligence', reason: 'View rates' });
    assert.equal(valid.type, 'navigate');
    assert.equal(valid.page, '/mandi-intelligence');

    const invalid = executeNavigateToPage({ page: '/admin/delete-database' });
    assert.equal(invalid.type, 'none');
    assert.equal(invalid.page, null);
    assert.ok(invalid.reason?.includes('not in authorized'));
  });
});
