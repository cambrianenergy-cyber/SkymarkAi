// lib/integrationValidator.ts

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface IntegrationStatus {
  name: string;
  connected: boolean;
  credentialsValid: boolean;
  expiresAt?: Date;
  daysUntilExpiry?: number;
  lastVerified?: Date;
  error?: string;
}

/**
 * Validate integration tokens and return their status
 */
export async function validateIntegrations(
  workspaceId: string
): Promise<Record<string, IntegrationStatus>> {
  try {
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);

    if (!workspaceDoc.exists()) {
      return {};
    }

    const integrations = workspaceDoc.data()?.integrations || {};
    const status: Record<string, IntegrationStatus> = {};

    // Check each integration
    for (const [name, config] of Object.entries(integrations)) {
      status[name] = validateIntegration(name, config as any);
    }

    return status;
  } catch (error) {
    console.error('Failed to validate integrations:', error);
    return {};
  }
}

/**
 * Validate a single integration
 */
function validateIntegration(name: string, config: any): IntegrationStatus {
  const result: IntegrationStatus = {
    name,
    connected: false,
    credentialsValid: false,
  };

  if (!config) {
    result.error = 'No configuration found';
    return result;
  }

  // Check required fields based on integration type
  switch (name.toLowerCase()) {
    case 'google':
      result.credentialsValid = !!config.clientId && !!config.clientSecret;
      result.connected = result.credentialsValid && !isTokenExpired(config.expiresAt);
      break;

    case 'meta':
    case 'facebook':
    case 'instagram':
      result.credentialsValid = !!config.accessToken && config.accessToken.length > 0;
      result.connected = result.credentialsValid && !isTokenExpired(config.expiresAt);
      if (config.expiresAt) {
        const expiryDate = new Date(config.expiresAt);
        result.expiresAt = expiryDate;
        result.daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }
      break;

    case 'linkedin':
      result.credentialsValid = !!config.accessToken && config.accessToken.length > 0;
      result.connected = result.credentialsValid && !isTokenExpired(config.expiresAt);
      if (config.expiresAt) {
        const expiryDate = new Date(config.expiresAt);
        result.expiresAt = expiryDate;
        result.daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }
      break;

    case 'twilio':
      result.credentialsValid =
        !!config.accountSid &&
        !!config.authToken &&
        !!config.phoneNumber;
      result.connected = result.credentialsValid;
      break;

    case 'hubspot':
    case 'salesforce':
    case 'crm':
      result.credentialsValid = !!config.apiKey && config.apiKey.length > 0;
      result.connected = result.credentialsValid;
      break;

    case 'stripe':
      result.credentialsValid = !!config.secretKey && config.secretKey.length > 0;
      result.connected = result.credentialsValid;
      break;

    case 'scheduler':
    case 'buffer':
    case 'hootsuite':
      result.credentialsValid = !!config.apiKey && config.apiKey.length > 0;
      result.connected = result.credentialsValid;
      break;

    default:
      result.credentialsValid = !!config.apiKey || !!config.accessToken;
      result.connected = result.credentialsValid;
  }

  result.lastVerified = new Date();
  return result;
}

/**
 * Check if a token has expired
 */
function isTokenExpired(expiresAt: any): boolean {
  if (!expiresAt) return false;

  const expiryDate = new Date(expiresAt);
  return expiryDate < new Date();
}

/**
 * Get warning message for integration status
 */
export function getIntegrationWarning(status: IntegrationStatus): string | null {
  if (!status.credentialsValid) {
    return `${status.name} credentials not configured`;
  }

  if (!status.connected) {
    if (status.expiresAt && status.daysUntilExpiry! < 0) {
      return `${status.name} token has expired`;
    }
    return `${status.name} is not connected`;
  }

  if (status.daysUntilExpiry && status.daysUntilExpiry <= 30) {
    return `${status.name} token expires in ${status.daysUntilExpiry} days`;
  }

  return null;
}
