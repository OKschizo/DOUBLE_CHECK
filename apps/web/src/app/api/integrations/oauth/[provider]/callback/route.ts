import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { adminDb, FieldValue } from '@doublecheck/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/projects?error=oauth_error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/projects?error=missing_params`
    );
  }

  // Decode state to get integrationId
  let stateData: { integrationId: string; redirectUri?: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  } catch (e) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/projects?error=invalid_state`
    );
  }

  const { integrationId } = stateData;
  const integrationDoc = await adminDb.collection('integrations').doc(integrationId).get();

  if (!integrationDoc.exists) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/projects?error=integration_not_found`
    );
  }

  const integration = integrationDoc.data()!;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = stateData.redirectUri || `${baseUrl}/api/integrations/oauth/${provider}/callback`;

  try {
    let tokenData: any;

    switch (provider) {
      case 'slack': {
        if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
          throw new Error('Slack credentials not configured');
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: env.SLACK_CLIENT_ID,
            client_secret: env.SLACK_CLIENT_SECRET,
            code,
            redirect_uri: callbackUrl,
          }),
        });

        const tokenResult = await tokenResponse.json();

        if (!tokenResult.ok) {
          throw new Error(tokenResult.error || 'Failed to exchange token');
        }

        tokenData = {
          accessToken: tokenResult.access_token,
          refreshToken: tokenResult.refresh_token,
          tokenExpiresAt: tokenResult.expires_in
            ? new Date(Date.now() + tokenResult.expires_in * 1000)
            : undefined,
          slackTeamId: tokenResult.team?.id,
          slackTeamName: tokenResult.team?.name,
        };
        break;
      }

      case 'quickbooks': {
        if (!env.QUICKBOOKS_CLIENT_ID || !env.QUICKBOOKS_CLIENT_SECRET) {
          throw new Error('QuickBooks credentials not configured');
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: callbackUrl,
          }),
          // QuickBooks requires Basic Auth
          // Note: This is a simplified version - actual implementation may need adjustments
        });

        // QuickBooks OAuth is more complex - this is a placeholder
        // You'll need to implement proper Basic Auth header
        const tokenResult = await tokenResponse.json();

        tokenData = {
          accessToken: tokenResult.access_token,
          refreshToken: tokenResult.refresh_token,
          tokenExpiresAt: tokenResult.expires_in
            ? new Date(Date.now() + tokenResult.expires_in * 1000)
            : undefined,
          quickbooksRealmId: searchParams.get('realmId'),
        };
        break;
      }

      default:
        throw new Error(`OAuth callback not implemented for ${provider}`);
    }

    // Update integration with tokens
    await adminDb.collection('integrations').doc(integrationId).update({
      status: 'connected',
      config: {
        ...integration.config,
        ...tokenData,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Redirect back to project integrations page
    return NextResponse.redirect(
      `${baseUrl}/projects/${integration.projectId}#integrations`
    );
  } catch (error: any) {
    console.error(`OAuth callback error for ${provider}:`, error);
    
    // Update integration status to error
    await adminDb.collection('integrations').doc(integrationId).update({
      status: 'error',
      lastSyncError: error.message,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.redirect(
      `${baseUrl}/projects/${integration.projectId}?view=integrations&error=oauth_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}

