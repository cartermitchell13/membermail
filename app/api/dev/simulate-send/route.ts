/**
 * DEV ONLY: Simulate campaign send without actually sending emails
 * 
 * This endpoint simulates the entire campaign send process including:
 * - Fetching recipient list
 * - Generating mock email events (sent, delivered, opened, clicked)
 * - Updating campaign statistics
 * 
 * Use this to test campaign analytics and reporting without burning through
 * your Resend quota or spamming test emails.
 * 
 * POST /api/dev/simulate-send?campaignId=123
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// Only allow in development
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  // Safety check: only allow in development
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const supabase = getAdminSupabaseClient();
  const url = new URL(req.url);
  const campaignIdParam = url.searchParams.get('campaignId');

  if (!campaignIdParam) {
    return NextResponse.json({ error: 'Missing campaignId parameter' }, { status: 400 });
  }

  const campaignId = parseInt(campaignIdParam, 10);
  if (isNaN(campaignId)) {
    return NextResponse.json({ error: 'Invalid campaignId parameter' }, { status: 400 });
  }

  try {
    // Step 1: Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, community_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Step 2: Get all active members in this community
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('community_id', campaign.community_id)
      .eq('status', 'active');

    if (membersError) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No active members found' }, { status: 400 });
    }

    // Step 3: Generate mock email events for each member
    const events = [];
    let openCount = 0;
    let clickCount = 0;

    for (const member of members) {
      // Everyone gets a "sent" event
      events.push({
        campaign_id: campaignId,
        member_id: member.id,
        type: 'sent',
        metadata: { email: member.email },
        created_at: new Date().toISOString(),
      });

      // 95% get "delivered"
      if (Math.random() < 0.95) {
        events.push({
          campaign_id: campaignId,
          member_id: member.id,
          type: 'delivered',
          metadata: { email: member.email },
          created_at: new Date(Date.now() + 1000).toISOString(),
        });
      } else {
        // 5% bounce
        events.push({
          campaign_id: campaignId,
          member_id: member.id,
          type: 'bounced',
          metadata: { email: member.email, reason: 'mailbox_full' },
          created_at: new Date(Date.now() + 1000).toISOString(),
        });
        continue;
      }

      // 40% open the email
      if (Math.random() < 0.4) {
        openCount++;
        events.push({
          campaign_id: campaignId,
          member_id: member.id,
          type: 'opened',
          metadata: { email: member.email, user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
          created_at: new Date(Date.now() + 5000).toISOString(),
        });

        // Of those who opened, 25% click a link
        if (Math.random() < 0.25) {
          clickCount++;
          events.push({
            campaign_id: campaignId,
            member_id: member.id,
            type: 'clicked',
            metadata: { 
              email: member.email, 
              url: 'https://example.com/cta',
              link_text: 'Call to Action'
            },
            created_at: new Date(Date.now() + 10000).toISOString(),
          });
        }
      }
    }

    // Step 4: Insert all events
    const { error: eventsError } = await supabase
      .from('email_events')
      .insert(events);

    if (eventsError) {
      console.error('Failed to insert events:', eventsError);
      return NextResponse.json({ error: 'Failed to create events' }, { status: 500 });
    }

    // Step 5: Update campaign statistics
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: members.length,
        open_count: openCount,
        click_count: clickCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign:', updateError);
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    // Step 6: Return summary
    const deliveryRate = ((members.length - events.filter(e => e.type === 'bounced').length) / members.length * 100).toFixed(1);
    const openRate = (openCount / members.length * 100).toFixed(1);
    const clickRate = (clickCount / members.length * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      summary: {
        campaignId: campaignId,
        totalRecipients: members.length,
        sent: members.length,
        delivered: members.length - events.filter(e => e.type === 'bounced').length,
        bounced: events.filter(e => e.type === 'bounced').length,
        opened: openCount,
        clicked: clickCount,
        rates: {
          delivery: `${deliveryRate}%`,
          open: `${openRate}%`,
          click: `${clickRate}%`,
        },
        eventsCreated: events.length,
      },
      message: '✨ Campaign simulation complete! Check your analytics dashboard.',
    });

  } catch (error) {
    console.error('Error simulating send:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
