import { adminDb } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Integration } from '@doublecheck/schemas';

/**
 * Sync Slack integration - send notifications to Slack channels
 */
export async function syncSlack(
  integration: Integration,
  projectId: string,
  direction: 'import' | 'export' | 'both' = 'export'
): Promise<{ success: boolean; message: string; data?: any }> {
  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const accessToken = integration.config?.accessToken;
  if (!accessToken) {
    throw new Error('Slack access token not found');
  }

  // For now, this is a placeholder implementation
  // In a real implementation, you would:
  // 1. Fetch project updates (new scenes, schedule changes, etc.)
  // 2. Format messages based on integration config
  // 3. Send to Slack channel using Slack Web API

  // Send a test notification to Slack
  // For now, we'll send to a default channel or the general channel
  // In the future, users can configure which channel to use
  
  try {
    // First, let's test the connection by getting team info
    // Note: team.info might require 'team:read' scope, but we can also use auth.test
    const authTestResponse = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const authTest = await authTestResponse.json();
    
    if (!authTest.ok) {
      throw new Error(authTest.error || 'Failed to verify Slack connection');
    }

    // Get team info if available, otherwise use auth.test data
    let teamInfo: any = { ok: true, team: { name: authTest.team || 'Unknown', id: authTest.team_id } };
    
    try {
      const teamInfoResponse = await fetch('https://slack.com/api/team.info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const teamInfoResult = await teamInfoResponse.json();
      if (teamInfoResult.ok) {
        teamInfo = teamInfoResult;
      }
    } catch (e) {
      // team.info might fail if we don't have the scope, that's okay
      console.log('team.info not available, using auth.test data');
    }

    // Try to send a test message to #general channel (or configured channel)
    const channelId = integration.config?.slackChannelId || 'general';
    
    const messageResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: `✅ DoubleCheck integration test - Connected successfully at ${new Date().toLocaleString()}`,
      }),
    });

    const messageResult = await messageResponse.json();

    if (!messageResult.ok) {
      // If channel doesn't exist, that's okay - connection is still valid
      if (messageResult.error === 'channel_not_found') {
        return {
          success: true,
          message: `Connected to Slack workspace "${teamInfo.team?.name || 'Unknown'}". Channel "${channelId}" not found - please configure a valid channel.`,
          data: {
            teamName: teamInfo.team?.name,
            teamId: teamInfo.team?.id,
          },
        };
      }
      throw new Error(messageResult.error || 'Failed to send test message');
    }

    return {
      success: true,
      message: `Test message sent to #${messageResult.channel || channelId} in "${teamInfo.team?.name || 'Slack'}" workspace`,
      data: {
        teamName: teamInfo.team?.name,
        teamId: teamInfo.team?.id,
        channel: messageResult.channel || channelId,
        messageTs: messageResult.ts,
      },
    };
  } catch (error: any) {
    throw new Error(`Slack sync failed: ${error.message}`);
  }
}

/**
 * Sync Plaid integration - import bank transactions
 */
export async function syncPlaid(
  integration: Integration,
  projectId: string,
  direction: 'import' | 'export' | 'both' = 'import'
): Promise<{ success: boolean; message: string; data?: any }> {
  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const accessToken = integration.config?.accessToken;
  if (!accessToken) {
    throw new Error('Plaid access token not found');
  }

  // Placeholder - would use Plaid API to fetch transactions
  // This requires Plaid SDK and proper implementation

  return {
    success: true,
    message: 'Plaid sync completed (placeholder)',
  };
}

/**
 * Sync QuickBooks integration - export expenses to QuickBooks
 */
export async function syncQuickbooks(
  integration: Integration,
  projectId: string,
  direction: 'import' | 'export' | 'both' = 'export'
): Promise<{ success: boolean; message: string; data?: any }> {
  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const accessToken = integration.config?.accessToken;
  const realmId = integration.config?.quickbooksRealmId;

  if (!accessToken || !realmId) {
    throw new Error('QuickBooks credentials not found');
  }

  // Placeholder - would use QuickBooks API to create/update expenses
  // This requires QuickBooks SDK and proper implementation

  return {
    success: true,
    message: 'QuickBooks sync completed (placeholder)',
  };
}

/**
 * Sync Wrapbook integration - import payroll data
 */
export async function syncWrapbook(
  integration: Integration,
  projectId: string,
  direction: 'import' | 'export' | 'both' = 'import'
): Promise<{ success: boolean; message: string; data?: any }> {
  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const apiKey = integration.config?.accessToken; // Using accessToken field for API key
  if (!apiKey) {
    throw new Error('Wrapbook API key not found');
  }

  // Placeholder - would use Wrapbook API to fetch payroll data
  // This requires Wrapbook API documentation and implementation

  return {
    success: true,
    message: 'Wrapbook sync completed (placeholder)',
  };
}

/**
 * Main sync function that routes to appropriate sync handler
 */
export async function syncIntegration(
  integration: Integration,
  direction?: 'import' | 'export' | 'both'
): Promise<{ success: boolean; message: string; data?: any }> {
  const syncDirection = direction || integration.config?.syncDirection || 'import';

  switch (integration.type) {
    case 'slack':
      return syncSlack(integration, integration.projectId, syncDirection);
    case 'plaid':
      return syncPlaid(integration, integration.projectId, syncDirection);
    case 'quickbooks':
      return syncQuickbooks(integration, integration.projectId, syncDirection);
    case 'wrapbook':
      return syncWrapbook(integration, integration.projectId, syncDirection);
    case 'movie_magic_budgeting':
    case 'showbiz_budgeting':
      // File-based integrations are handled separately
      throw new Error('File-based integrations use import endpoint, not sync');
    default:
      throw new Error(`Sync not implemented for integration type: ${integration.type}`);
  }
}

