'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { integrationMetadata, type IntegrationType } from '@doublecheck/schemas';
import { createPortal } from 'react-dom';

interface IntegrationModalProps {
  projectId: string;
  integrationType: IntegrationType;
  onClose: () => void;
}

export function IntegrationModal({
  projectId,
  integrationType,
  onClose,
}: IntegrationModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const utils = trpc.useUtils();

  const metadata = integrationMetadata[integrationType];
  const createIntegration = trpc.integrations.create.useMutation({
    onSuccess: async (integration) => {
      utils.integrations.listByProject.invalidate({ projectId });
      
      if (metadata.requiresOAuth) {
        // Redirect to OAuth initiation route
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const oauthUrl = `${baseUrl}/api/integrations/oauth/${integrationType}?integrationId=${integration.id}`;
        
        if (typeof window !== 'undefined') {
          window.location.href = oauthUrl;
        }
      } else {
        // For file-based integrations, just close the modal
        // File upload will be handled separately
        onClose();
      }
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await createIntegration.mutateAsync({
        projectId,
        type: integrationType,
        name: metadata.name,
        description: metadata.description,
      });
    } catch (error) {
      console.error('Error creating integration:', error);
      setIsConnecting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border-default rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{metadata.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{metadata.name}</h2>
              <p className="text-sm text-text-secondary">{metadata.category}</p>
            </div>
          </div>
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
          <p className="text-text-secondary">{metadata.description}</p>

          {metadata.requiresOAuth ? (
            <div className="bg-background-tertiary p-4 rounded-lg">
              <p className="text-sm text-text-secondary">
                You&apos;ll be redirected to authenticate with {metadata.name}. After authorization,
                you&apos;ll be brought back to complete the connection.
              </p>
            </div>
          ) : (
            <div className="bg-background-tertiary p-4 rounded-lg">
              <p className="text-sm text-text-secondary">
                This integration supports file import. You&apos;ll be able to upload files after
                connecting.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-primary flex-1"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
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

