/**
 * Server-Side Tool: navigate_to_page (Strict Route Whitelist)
 */

import type { WhitelistedRoute, ProposedNavigationAction } from '../../models/assistant.ts';

export const WHITELISTED_ROUTES: WhitelistedRoute[] = [
  '/home',
  '/weather-advisory',
  '/crop-advisory',
  '/mandi-intelligence',
  '/scheme-finder',
];

export const navigateToPageDeclaration = {
  name: 'navigate_to_page',
  description: 'Propose proactive navigation to a specific page inside KrishiMitra AI to show relevant UI details.',
  parameters: {
    type: 'object',
    properties: {
      page: {
        type: 'string',
        enum: ['/home', '/weather-advisory', '/crop-advisory', '/mandi-intelligence', '/scheme-finder'],
        description: 'Whitelisted page destination route',
      },
      reason: { type: 'string', description: 'Reason for navigation' },
    },
    required: ['page'],
  },
};

export function executeNavigateToPage(args: { page: string; reason?: string }): ProposedNavigationAction {
  const target = (args.page || '').trim() as WhitelistedRoute;

  if (WHITELISTED_ROUTES.includes(target)) {
    return {
      type: 'navigate',
      page: target,
      reason: args.reason || `Navigating to ${target}`,
    };
  }

  return {
    type: 'none',
    page: null,
    reason: `Requested page '${args.page}' is not in authorized navigation whitelist.`,
  };
}
