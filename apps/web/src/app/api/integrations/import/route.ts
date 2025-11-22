import { NextRequest, NextResponse } from 'next/server';
import { adminDb, importBudgetFile, FieldValue } from '@doublecheck/api';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const integrationId = formData.get('integrationId') as string;

    if (!file || !integrationId) {
      return NextResponse.json(
        { error: 'File and integrationId are required' },
        { status: 400 }
      );
    }

    // Get integration to verify it exists and get type
    const integrationDoc = await adminDb.collection('integrations').doc(integrationId).get();
    if (!integrationDoc.exists) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrationDoc.data()!;
    const integrationType = integration.type;

    // Only allow file imports for Movie Magic and Showbiz
    if (integrationType !== 'movie_magic_budgeting' && integrationType !== 'showbiz_budgeting') {
      return NextResponse.json(
        { error: 'File import not supported for this integration type' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import the file
    const result = await importBudgetFile(
      integrationType,
      buffer,
      integration.projectId
    );

    // Update integration with import date
    await adminDb.collection('integrations').doc(integrationId).update({
      'config.lastImportDate': FieldValue.serverTimestamp(),
      lastSyncAt: FieldValue.serverTimestamp(),
      lastSyncStatus: result.success ? 'success' : 'error',
      lastSyncError: result.success ? undefined : result.message,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('File import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import file' },
      { status: 500 }
    );
  }
}

