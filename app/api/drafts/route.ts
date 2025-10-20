/**
 * API routes for draft CRUD operations
 * Handles creating, updating, and listing drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * GET /api/drafts - List all drafts for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const { searchParams } = new URL(req.url);
    const experienceId = searchParams.get('experienceId');
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);

    const supabase = getBrowserSupabaseClient();

    let query = supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (experienceId) {
      query = query.eq('experience_id', experienceId);
    }

    const { data: drafts, error } = await query;

    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error in GET /api/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/drafts - Create a new draft
 */
export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const body = await req.json();
    const {
      campaignId,
      experienceId,
      subject,
      previewText,
      htmlContent,
      editorJson,
    } = body;

    if (!experienceId) {
      return NextResponse.json({ error: 'experienceId is required' }, { status: 400 });
    }

    const supabase = getBrowserSupabaseClient();

    // Create new draft
    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        campaign_id: campaignId || null,
        user_id: userId,
        experience_id: experienceId,
        subject: subject || '',
        preview_text: previewText || '',
        html_content: htmlContent || '',
        editor_json: editorJson || null,
        last_edited_by: userId,
        is_draft: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating draft:', error);
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
    }

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/drafts - Update an existing draft
 */
export async function PUT(req: NextRequest) {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const body = await req.json();
    const {
      id,
      campaignId,
      experienceId,
      subject,
      previewText,
      htmlContent,
      editorJson,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Draft id is required' }, { status: 400 });
    }

    const supabase = getBrowserSupabaseClient();

    // Update existing draft
    const { data: draft, error } = await supabase
      .from('drafts')
      .update({
        campaign_id: campaignId || null,
        experience_id: experienceId,
        subject: subject || '',
        preview_text: previewText || '',
        html_content: htmlContent || '',
        editor_json: editorJson || null,
        last_edited_by: userId,
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this draft
      .select()
      .single();

    if (error) {
      console.error('Error updating draft:', error);
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error in PUT /api/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
