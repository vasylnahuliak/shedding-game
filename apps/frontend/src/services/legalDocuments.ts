import * as WebBrowser from 'expo-web-browser';

import { APP_URL } from '@/config';

import { LoggingService } from './LoggingService';

type LegalDocumentId = 'privacy-policy' | 'terms';

const LEGAL_DOCUMENT_PATHS: Record<LegalDocumentId, string> = {
  'privacy-policy': '/privacy-policy/',
  terms: '/terms/',
};

const buildLegalDocumentUrl = (documentId: LegalDocumentId) =>
  new URL(LEGAL_DOCUMENT_PATHS[documentId], `${APP_URL.replace(/\/+$/, '')}/`).toString();

const openLegalDocument = async (documentId: LegalDocumentId) => {
  const url = buildLegalDocumentUrl(documentId);

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch (error) {
    LoggingService.warn('Failed to open legal document', {
      documentId,
      error: error instanceof Error ? error.message : String(error),
      url,
    });
  }
};

export const openPrivacyPolicy = () => openLegalDocument('privacy-policy');
export const openTermsOfUse = () => openLegalDocument('terms');
