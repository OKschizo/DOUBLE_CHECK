'use client';

import { useState } from 'react';
import { integrationMetadata, type IntegrationType } from '@/lib/schemas';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationModal } from './IntegrationModal';
import { useIntegrations } from '../hooks/useIntegrations';

interface IntegrationsViewProps {
  projectId: string;
}

export function IntegrationsView({ projectId }: IntegrationsViewProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { integrations, isLoading } = useIntegrations(projectId);

  // Mock available types for client-side demo
  const availableTypes: any[] = [
    { type: 'slack', category: 'communication', name: 'Slack', description: 'Send notifications to Slack channels', icon: '💬' },
    { type: 'google_drive', category: 'storage', name: 'Google Drive', description: 'Sync files with Google Drive', icon: '📁' },
    // Add more mocks as needed
  ];

  const handleAddIntegration = (type: IntegrationType) => {
    setSelectedIntegration(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIntegration(null);
  };

  const groupedIntegrations = availableTypes.reduce((acc, type) => {
    const category = type.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, typeof availableTypes>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-text-primary">Integrations</h1>
          <p className="text-text-secondary">
            Connect your favorite tools to streamline your production workflow
          </p>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                projectId={projectId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations by Category */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Available Integrations</h2>
        {Object.entries(groupedIntegrations).map(([category, types]) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-medium text-text-secondary mb-3 capitalize">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((type) => {
                const isConnected = integrations.some((int) => int.type === type.type);
                return (
                  <div
                    key={type.type}
                    className={`card-elevated p-6 cursor-pointer hover:scale-105 transition-transform ${
                      isConnected ? 'opacity-60' : ''
                    }`}
                    onClick={() => !isConnected && handleAddIntegration(type.type as IntegrationType)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{type.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary mb-1">
                          {type.name}
                        </h4>
                        <p className="text-sm text-text-secondary mb-4">{type.description}</p>
                        {isConnected ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                            Connected
                          </span>
                        ) : (
                          <button className="btn-primary text-sm">Connect</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Integration Modal */}
      {showModal && selectedIntegration && (
        <IntegrationModal
          projectId={projectId}
          integrationType={selectedIntegration}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

