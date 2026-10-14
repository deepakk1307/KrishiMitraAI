/**
 * Production Real-Data Mandi Adapter Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MandiApiClient } from '../src/services/mandi/mandiApiClient.ts';
import { MandiCache } from '../src/services/mandi/mandiCache.ts';
import { MandiService } from '../src/services/mandi/mandiService.ts';

describe('Production Real-Data Mandi Adapter Test Suite', () => {
  it('successful API response: should parse modal, min, max prices, arrival date, and nearby mandis', async () => {
    const mockApiClient = new MandiApiClient('test-key');

    mockApiClient.fetchMandiData = async (_query) => {
      return {
        commodity: 'Wheat',
        crop: 'Wheat',
        variety: 'Dara / FAQ',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        market: 'Lucknow APMC',
        primary_mandi: 'Lucknow APMC',
        current_price: 2450,
        modal_price: 2450,
        min_price: 2380,
        max_price: 2520,
        arrival_date: '22/08/2026',
        msp_declared: 2275,
        nearby_mandis: [
          { mandi_name: 'Barabanki APMC', district: 'Barabanki', distance_km: 28, modal_price: 2480 },
          { mandi_name: 'Sitapur APMC', district: 'Sitapur', distance_km: 55, modal_price: 2420 },
        ],
        data_timestamp: new Date().toISOString(),
        source: 'data.gov.in / Agmarknet Daily Mandi Price API',
        is_available: true,
      };
    };

    const service = new MandiService(mockApiClient, new MandiCache(10));
    const result = await service.getMandiPrices({ crop: 'Wheat', state: 'Uttar Pradesh', district: 'Lucknow' });
    const advisory = service.generateMarketAdvisory(result);

    assert.equal(result.is_available, true);
    assert.equal(result.modal_price, 2450);
    assert.equal(result.min_price, 2380);
    assert.equal(result.max_price, 2520);
    assert.equal(result.arrival_date, '22/08/2026');
    assert.equal(result.nearby_mandis.length, 2);
    assert.equal(advisory.market_analysis.selling_recommendation, 'favorable_time_to_sell');
    assert.ok(advisory.market_analysis.best_nearby_market?.includes('Barabanki APMC'));
  });

  it('API failure: should return clear unavailable state without throwing or fabricating fake prices', async () => {
    const failingClient = new MandiApiClient('test-key');
    failingClient.fetchMandiData = async (query) => {
      return {
        commodity: query.crop,
        crop: query.crop,
        variety: 'N/A',
        state: query.state || 'Uttar Pradesh',
        district: query.district || 'Lucknow',
        market: `${query.district} APMC Yard`,
        primary_mandi: `${query.district} APMC Yard`,
        current_price: 0,
        modal_price: 0,
        min_price: 0,
        max_price: 0,
        arrival_date: '22/08/2026',
        msp_declared: 2275,
        nearby_mandis: [],
        data_timestamp: new Date().toISOString(),
        source: 'data.gov.in / Agmarknet Daily Mandi API',
        is_available: false,
        unavailable_reason: 'Government market data source currently unreachable (HTTP 503).',
      };
    };

    const service = new MandiService(failingClient, new MandiCache(10));
    const result = await service.getMandiPrices({ crop: 'Wheat', state: 'Uttar Pradesh', district: 'Lucknow' });
    const advisory = service.generateMarketAdvisory(result);

    assert.equal(result.is_available, false);
    assert.equal(result.modal_price, 0);
    assert.equal(result.current_price, 0);
    assert.equal(advisory.market_analysis.selling_recommendation, 'data_unavailable');
    assert.ok(advisory.market_analysis.advice.includes('Live market data is currently unavailable'));
    assert.ok(advisory.market_analysis.caution.includes('Prices are never fabricated'));
  });

  it('invalid commodity: should return unavailable state with descriptive reason', async () => {
    const emptyClient = new MandiApiClient('test-key');
    emptyClient.fetchMandiData = async (query) => {
      return {
        commodity: query.crop,
        crop: query.crop,
        variety: 'N/A',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        market: 'Lucknow APMC Yard',
        primary_mandi: 'Lucknow APMC Yard',
        current_price: 0,
        modal_price: 0,
        min_price: 0,
        max_price: 0,
        msp_declared: 0,
        nearby_mandis: [],
        data_timestamp: new Date().toISOString(),
        source: 'data.gov.in / Agmarknet Daily Mandi API',
        is_available: false,
        unavailable_reason: `No active mandi arrivals reported for ${query.crop} in Lucknow, Uttar Pradesh for today.`,
      };
    };

    const service = new MandiService(emptyClient, new MandiCache(10));
    const result = await service.getMandiPrices({ crop: 'DragonfruitUnknown', state: 'Uttar Pradesh', district: 'Lucknow' });

    assert.equal(result.is_available, false);
    assert.ok(result.unavailable_reason?.includes('No active mandi arrivals reported'));
  });

  it('missing API key: should gracefully return unavailable state without fabricating prices', async () => {
    const keylessClient = new MandiApiClient('');
    const result = await keylessClient.fetchMandiData({ crop: 'Wheat', state: 'Uttar Pradesh', district: 'Lucknow' });

    assert.equal(result.is_available, false);
    assert.equal(result.modal_price, 0);
    assert.equal(result.msp_declared, 2275);
    assert.ok(result.unavailable_reason?.includes('MANDI_API_KEY'));
  });

  it('caching & stale data: should return cached entry within TTL and re-fetch when expired', async () => {
    let apiCallCount = 0;
    const client = new MandiApiClient('test-key');
    client.fetchMandiData = async (_query) => {
      apiCallCount++;
      return {
        commodity: 'Mustard',
        crop: 'Mustard',
        variety: 'Black Mustard',
        state: 'Rajasthan',
        district: 'Jaipur',
        market: 'Jaipur APMC',
        primary_mandi: 'Jaipur APMC',
        current_price: 5700,
        modal_price: 5700,
        min_price: 5500,
        max_price: 5850,
        arrival_date: '22/08/2026',
        msp_declared: 5650,
        nearby_mandis: [],
        data_timestamp: new Date().toISOString(),
        source: 'data.gov.in',
        is_available: true,
      };
    };

    const cache = new MandiCache(60);
    const service = new MandiService(client, cache);

    const first = await service.getMandiPrices({ crop: 'Mustard', state: 'Rajasthan', district: 'Jaipur' });
    assert.equal(apiCallCount, 1);
    assert.equal(first.modal_price, 5700);

    const second = await service.getMandiPrices({ crop: 'Mustard', state: 'Rajasthan', district: 'Jaipur' });
    assert.equal(apiCallCount, 1);
    assert.equal(second.cached, true);

    cache.set('Mustard', 'Rajasthan', 'Jaipur', first, -1000);
    const third = await service.getMandiPrices({ crop: 'Mustard', state: 'Rajasthan', district: 'Jaipur' });
    assert.equal(apiCallCount, 2);
  });
});
