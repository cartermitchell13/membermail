/**
 * API routes for individual draft operations
 * Handles fetching and deleting specific drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * GET /api/drafts/[id] - Get a specific draft
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    const { id } = await params;

    const supabase = getBrowserSupabaseClient();

    const { data: draft, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this draft
      .single();

    if (error) {
      console.error('Error fetching draft:', error);
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error in GET /api/drafts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts/[id] - Delete a specific draft
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    const { id } = await params;

    const supabase = getBrowserSupabaseClient();

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns this draft

    if (error) {
      console.error('Error deleting draft:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/drafts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
