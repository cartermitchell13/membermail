/**
 * Quick script to check the current state of test data
 * Run with: npx tsx scripts/check-test-data.ts
 * 
 * Shows:
 * - Number of communities
 * - Number of members per community
 * - Member status breakdown
 * - Number of campaigns
 * - Campaign status breakdown
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTestData() {
  console.log('🔍 Checking MemberMail test data...\n');

  try {
    // Check communities
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*');

    if (communitiesError) {
      throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
    }

    console.log('🏢 Communities:');
    console.log(`   Total: ${communities?.length || 0}\n`);
    
    if (communities && communities.length > 0) {
      for (const community of communities) {
        console.log(`   📍 ${community.name}`);
        console.log(`      ID: ${community.id}`);
        console.log(`      Whop ID: ${community.whop_community_id}`);
        console.log(`      Member Count: ${community.member_count}`);
        console.log(`      Last Sync: ${community.last_sync_at || 'Never'}\n`);

        // Get members for this community
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('community_id', community.id);

        if (membersError) {
          console.log(`      ⚠️  Failed to fetch members: ${membersError.message}\n`);
          continue;
        }

        const activeCount = members?.filter(m => m.status === 'active').length || 0;
        const cancelledCount = members?.filter(m => m.status === 'cancelled').length || 0;
        const pausedCount = members?.filter(m => m.status === 'paused').length || 0;

        console.log(`   👥 Members: ${members?.length || 0}`);
        console.log(`      Active: ${activeCount}`);
        console.log(`      Cancelled: ${cancelledCount}`);
        console.log(`      Paused: ${pausedCount}\n`);

        // Get member tier breakdown
        const tiers = members?.reduce((acc, m) => {
          const tier = m.membership_tier || 'unknown';
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        if (tiers && Object.keys(tiers).length > 0) {
          console.log(`   🎯 Tier Breakdown:`);
          for (const [tier, count] of Object.entries(tiers)) {
            console.log(`      ${tier}: ${count}`);
          }
          console.log('');
        }

        // Get campaigns for this community
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('community_id', community.id);

        if (campaignsError) {
          console.log(`      ⚠️  Failed to fetch campaigns: ${campaignsError.message}\n`);
          continue;
        }

        console.log(`   📧 Campaigns: ${campaigns?.length || 0}`);
        
        if (campaigns && campaigns.length > 0) {
          const draftCount = campaigns.filter(c => c.status === 'draft').length;
          const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;
          const sentCount = campaigns.filter(c => c.status === 'sent').length;
          const sendingCount = campaigns.filter(c => c.status === 'sending').length;
          const failedCount = campaigns.filter(c => c.status === 'failed').length;

          console.log(`      Draft: ${draftCount}`);
          console.log(`      Scheduled: ${scheduledCount}`);
          console.log(`      Sending: ${sendingCount}`);
          console.log(`      Sent: ${sentCount}`);
          console.log(`      Failed: ${failedCount}\n`);

          // Show recent campaigns
          const recentCampaigns = campaigns
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

          console.log(`   📋 Recent Campaigns:`);
          for (const campaign of recentCampaigns) {
            const date = new Date(campaign.created_at).toLocaleDateString();
            const openRate = campaign.recipient_count > 0 
              ? ((campaign.open_count / campaign.recipient_count) * 100).toFixed(1)
              : '0.0';
            console.log(`      • ${campaign.subject} (${campaign.status})`);
            console.log(`        ${date} | Recipients: ${campaign.recipient_count} | Open Rate: ${openRate}%`);
          }
          console.log('');
        }

        // Get email events for this community
        const { data: events, error: eventsError } = await supabase
          .from('email_events')
          .select('*')
          .in('campaign_id', campaigns?.map(c => c.id) || []);

        if (!eventsError && events) {
          console.log(`   📊 Email Events: ${events.length}`);
          const eventTypes = events.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          for (const [type, count] of Object.entries(eventTypes)) {
            console.log(`      ${type}: ${count}`);
          }
          console.log('');
        }

        console.log('   ' + '─'.repeat(60) + '\n');
      }
    }

    // Overall summary
    const { data: allMembers } = await supabase.from('members').select('id');
    const { data: allCampaigns } = await supabase.from('campaigns').select('id');
    const { data: allEvents } = await supabase.from('email_events').select('id');

    console.log('📊 Overall Summary:');
    console.log(`   Communities: ${communities?.length || 0}`);
    console.log(`   Total Members: ${allMembers?.length || 0}`);
    console.log(`   Total Campaigns: ${allCampaigns?.length || 0}`);
    console.log(`   Total Events: ${allEvents?.length || 0}\n`);

    if (!communities || communities.length === 0) {
      console.log('💡 Tip: Run the seeding script to create test data:');
      console.log('   npx tsx scripts/seed-test-data.ts\n');
    }

  } catch (error) {
    console.error('❌ Error checking test data:', error);
    process.exit(1);
  }
}

checkTestData();
