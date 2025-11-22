import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { adminDb } from '@doublecheck/api';
import { FieldValue } from '@doublecheck/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const integrationId = searchParams.get('integrationId');
  const redirectUri = searchParams.get('redirectUri') || searchParams.get('redirect_uri');

  if (!integrationId) {
    return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
  }

  // Get integration to verify it exists
  const integrationDoc = await adminDb.collection('integrations').doc(integrationId).get();
  if (!integrationDoc.exists) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  const integration = integrationDoc.data()!;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = redirectUri || `${baseUrl}/api/integrations/oauth/${provider}/callback`;

  let oauthUrl: string;

  switch (provider) {
    case 'slack': {
      if (!env.SLACK_CLIENT_ID) {
        return NextResponse.json(
          { error: 'Slack credentials not configured' },
          { status: 500 }
        );
      }

      // Required scopes for Slack integration:
      // - chat:write - Send messages
      // - channels:read - List public channels
      // - channels:join - Join public channels
      // - users:read - Get user/team info (for team.info API)
      // - conversations:read - Read channel information
      const scopes = [
        'chat:write',
        'channels:read',
        'channels:join',
        'users:read',
        'conversations:read',
      ].join(',');
      const state = Buffer.from(JSON.stringify({ integrationId, redirectUri: callbackUrl })).toString('base64');
      
      oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
      break;
    }

    case 'plaid': {
      // Plaid uses Link - this would typically be handled client-side
      // For now, return a placeholder
      return NextResponse.json(
        { error: 'Plaid integration requires client-side Link flow' },
        { status: 501 }
      );
    }

    case 'quickbooks': {
      if (!env.QUICKBOOKS_CLIENT_ID) {
        return NextResponse.json(
          { error: 'QuickBooks credentials not configured' },
          { status: 500 }
        );
      }

      const scopes = 'com.intuit.quickbooks.accounting';
      const state = Buffer.from(JSON.stringify({ integrationId, redirectUri: callbackUrl })).toString('base64');
      
      oauthUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${env.QUICKBOOKS_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&state=${state}`;
      break;
    }

    case 'wrapbook': {
      // Wrapbook API documentation would be needed
      return NextResponse.json(
        { error: 'Wrapbook OAuth not yet implemented' },
        { status: 501 }
      );
    }

    default:
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  // Redirect to OAuth URL
  return NextResponse.redirect(oauthUrl);
}

