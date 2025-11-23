'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { type Integration } from '@/lib/schemas';
import { createPortal } from 'react-dom';

interface IntegrationSettingsModalProps {
  integration: Integration;
  projectId: string;
  onClose: () => void;
}

export function IntegrationSettingsModal({
  integration,
  projectId,
  onClose,
}: IntegrationSettingsModalProps) {
  const [selectedChannelId, setSelectedChannelId] = useState(
    integration.config?.slackChannelId || ''
  );
  const [selectedChannelName, setSelectedChannelName] = useState(
    integration.config?.slackChannelName || ''
  );

  const utils = trpc.useUtils();
  const updateIntegration = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.listByProject.invalidate({ projectId });
      onClose();
    },
  });

  const { data: channelsData, isLoading: channelsLoading } =
    trpc.integrations.getSlackChannels.useQuery(
      { integrationId: integration.id },
      {
        enabled: integration.type === 'slack' && integration.status === 'connected',
      }
    );

  const handleSave = async () => {
    const channel = channelsData?.channels.find((c: any) => c.id === selectedChannelId);
    
    await updateIntegration.mutateAsync({
      id: integration.id,
      config: {
        ...integration.config,
        slackChannelId: selectedChannelId || undefined,
        slackChannelName: channel?.name || selectedChannelName || undefined,
      },
    });
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border-default rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-xl font-semibold text-text-primary">Configure Slack</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {integration.config?.slackTeamName && (
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Workspace
              </label>
              <p className="text-text-primary">{integration.config.slackTeamName}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Channel
            </label>
            {channelsLoading ? (
              <div className="text-text-tertiary text-sm">Loading channels...</div>
            ) : channelsData?.channels && channelsData.channels.length > 0 ? (
              <select
                value={selectedChannelId}
                onChange={(e) => {
                  const channel = channelsData.channels.find((c: any) => c.id === e.target.value);
                  setSelectedChannelId(e.target.value);
                  setSelectedChannelName(channel?.name || '');
                }}
                className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="">Select a channel...</option>
                {channelsData.channels.map((channel: any) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name} {channel.isPrivate ? '(Private)' : ''}
                    {!channel.isMember ? ' (Not a member - invite bot first)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-3">
                <div className="bg-background-tertiary p-4 rounded-lg">
                  <p className="text-sm text-text-secondary mb-2">
                    No channels found. To use Slack notifications:
                  </p>
                  <ol className="text-sm text-text-secondary list-decimal list-inside space-y-1">
                    <li>Go to your Slack workspace</li>
                    <li>Invite the <strong>@doublecheck</strong> bot to a channel (type <code className="bg-background-secondary px-1 rounded">/invite @doublecheck</code> in the channel)</li>
                    <li>Or create a new channel and add the bot</li>
                    <li>Refresh this page to see available channels</li>
                  </ol>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary text-sm w-full"
                >
                  Refresh Channels
                </button>
              </div>
            )}
          </div>

          {selectedChannelId && (
            <div className="bg-background-tertiary p-3 rounded-lg">
              <p className="text-xs text-text-secondary">
                Messages will be sent to #{selectedChannelName || 'selected channel'} when you sync.
              </p>
              {channelsData?.channels.find((c: any) => c.id === selectedChannelId)?.isMember === false && (
                <p className="text-xs text-error mt-2">
                  ⚠️ The bot is not a member of this channel. Invite @doublecheck to the channel in Slack first.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateIntegration.isPending}
              className="btn-primary flex-1"
            >
              {updateIntegration.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

