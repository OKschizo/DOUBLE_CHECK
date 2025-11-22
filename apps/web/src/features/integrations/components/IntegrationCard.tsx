'use client';

import { trpc } from '@/lib/trpc/client';
import { integrationMetadata, type Integration } from '@doublecheck/schemas';
import { useState } from 'react';
import { IntegrationSettingsModal } from './IntegrationSettingsModal';

interface IntegrationCardProps {
  integration: Integration;
  projectId: string;
}

export function IntegrationCard({ integration, projectId }: IntegrationCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const utils = trpc.useUtils();

  const metadata = integrationMetadata[integration.type];
  const deleteIntegration = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      utils.integrations.listByProject.invalidate({ projectId });
    },
  });

  const syncIntegration = trpc.integrations.sync.useMutation({
    onSuccess: (result) => {
      utils.integrations.listByProject.invalidate({ projectId });
      setIsSyncing(false);
      if (result.message) {
        alert(result.message);
      }
    },
    onError: (error) => {
      setIsSyncing(false);
      alert(`Sync failed: ${error.message}`);
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    await syncIntegration.mutateAsync({ integrationId: integration.id });
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      await deleteIntegration.mutateAsync({ id: integration.id });
    }
  };

  const statusColors = {
    disconnected: 'bg-gray-500/10 text-gray-400',
    connecting: 'bg-blue-500/10 text-blue-400',
    connected: 'bg-green-500/10 text-green-400',
    error: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{metadata.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {integration.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[integration.status]
              }`}
            >
              {integration.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {integration.description && (
        <p className="text-sm text-text-secondary mb-4">{integration.description}</p>
      )}

      {/* Show connection details for Slack */}
      {integration.type === 'slack' && integration.status === 'connected' && (
        <div className="bg-background-tertiary p-3 rounded-lg mb-4 space-y-1">
          {integration.config?.slackTeamName && (
            <div className="text-xs text-text-secondary">
              <span className="font-medium">Workspace:</span> {integration.config.slackTeamName}
            </div>
          )}
          {integration.config?.slackChannelName && (
            <div className="text-xs text-text-secondary">
              <span className="font-medium">Channel:</span> #{integration.config.slackChannelName}
            </div>
          )}
          {!integration.config?.slackChannelName && (
            <div className="text-xs text-text-tertiary italic">
              No channel configured - messages will go to #general
            </div>
          )}
        </div>
      )}

      {integration.lastSyncAt && (
        <div className="text-xs text-text-tertiary mb-4">
          Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
        </div>
      )}

      {integration.lastSyncError && (
        <div className="text-xs text-error mb-4 bg-error/10 p-2 rounded">
          Last error: {integration.lastSyncError}
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-border-default">
        {integration.status === 'connected' && (
          <>
            {integration.type === 'slack' && (
              <button
                onClick={() => setShowSettings(true)}
                className="btn-secondary text-sm"
                title="Configure channel"
              >
                Settings
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn-secondary text-sm flex-1"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </>
        )}
        <button
          onClick={handleDisconnect}
          className="btn-secondary text-sm text-error hover:bg-error/10"
        >
          Disconnect
        </button>
      </div>

      {showSettings && (
        <IntegrationSettingsModal
          integration={integration}
          projectId={projectId}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

