import {
  ETACredentials,
  ETAToken,
  ETADocument,
  ETASubmissionRequest,
  ETASubmissionResponse,
  ETADocumentStatus,
} from './types';

const ETA_URLS = {
  preprod: {
    idSrv: 'https://id.preprod.eta.gov.eg',
    api: 'https://api.preprod.eta.gov.eg/api/v1.0',
  },
  production: {
    idSrv: 'https://id.eta.gov.eg',
    api: 'https://api.invoicing.eta.gov.eg/api/v1.0',
  },
};

export class ETAClient {
  private credentials: ETACredentials;
  private token: ETAToken | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials: ETACredentials) {
    this.credentials = credentials;
  }

  private get urls() {
    return ETA_URLS[this.credentials.environment];
  }

  // Get access token from ETA Identity Server
  async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token.access_token;
    }

    const response = await fetch(`${this.urls.idSrv}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        scope: 'InvoicingAPI',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ETA Authentication failed: ${error}`);
    }

    this.token = await response.json();
    // Set expiry to 5 minutes before actual expiry
    this.tokenExpiry = new Date(Date.now() + (this.token!.expires_in - 300) * 1000);

    return this.token!.access_token;
  }

  // Submit documents to ETA
  async submitDocuments(documents: ETADocument[]): Promise<ETASubmissionResponse> {
    const token = await this.getToken();

    const request: ETASubmissionRequest = { documents };

    const response = await fetch(`${this.urls.api}/documentsubmissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Submission failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Get document status
  async getDocumentStatus(uuid: string): Promise<ETADocumentStatus> {
    const token = await this.getToken();

    const response = await fetch(`${this.urls.api}/documents/${uuid}/raw`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Status check failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Cancel document
  async cancelDocument(uuid: string, reason: string): Promise<void> {
    const token = await this.getToken();

    const response = await fetch(`${this.urls.api}/documents/state/${uuid}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled',
        reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Cancel failed: ${JSON.stringify(error)}`);
    }
  }

  // Get recent documents
  async getRecentDocuments(pageSize = 10, pageNo = 1): Promise<unknown> {
    const token = await this.getToken();

    const response = await fetch(
      `${this.urls.api}/documents/recent?PageSize=${pageSize}&PageNo=${pageNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Get documents failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}

// Helper function to create ETA client from company settings
export async function createETAClient(companyId: string): Promise<ETAClient | null> {
  const { prisma } = await import('@/lib/db/prisma');

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      etaClientId: true,
      etaClientSecret: true,
      etaEnvironment: true,
    },
  });

  if (!company?.etaClientId || !company?.etaClientSecret) {
    return null;
  }

  return new ETAClient({
    clientId: company.etaClientId,
    clientSecret: company.etaClientSecret,
    environment: (company.etaEnvironment as 'preprod' | 'production') || 'preprod',
  });
}
