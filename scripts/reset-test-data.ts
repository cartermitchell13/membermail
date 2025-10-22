/**
 * Reset all test data in the database
 * Run with: npx tsx scripts/reset-test-data.ts
 * 
 * WARNING: This will delete all data for test communities!
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
const TEST_COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_testcompany123';

async function resetTestData() {
  console.log('🗑️  Resetting test data...\n');
  console.log(`⚠️  This will delete ALL data for community: ${TEST_COMPANY_ID}\n`);

  try {
    // Get the community ID first
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('whop_community_id', TEST_COMPANY_ID)
      .single();

    if (communityError || !community) {
      console.log('✅ No test community found. Nothing to delete.\n');
      return;
    }

    console.log(`Found community ID: ${community.id}\n`);

    // Step 1: Delete email events
    console.log('🧹 Deleting email events...');
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('community_id', community.id);

    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);
      const { error: eventsError } = await supabase
        .from('email_events')
        .delete()
        .in('campaign_id', campaignIds);

      if (eventsError) {
        console.error(`   ⚠️  Error deleting events: ${eventsError.message}`);
      } else {
        console.log('   ✅ Email events deleted');
      }
    }

    // Step 2: Delete campaigns
    console.log('🧹 Deleting campaigns...');
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .eq('community_id', community.id);

    if (campaignsError) {
      console.error(`   ⚠️  Error deleting campaigns: ${campaignsError.message}`);
    } else {
      console.log('   ✅ Campaigns deleted');
    }

    // Step 3: Delete members
    console.log('🧹 Deleting members...');
    const { error: membersError } = await supabase
      .from('members')
      .delete()
      .eq('community_id', community.id);

    if (membersError) {
      console.error(`   ⚠️  Error deleting members: ${membersError.message}`);
    } else {
      console.log('   ✅ Members deleted');
    }

    // Step 4: Delete community
    console.log('🧹 Deleting community...');
    const { error: deleteCommunityError } = await supabase
      .from('communities')
      .delete()
      .eq('id', community.id);

    if (deleteCommunityError) {
      console.error(`   ⚠️  Error deleting community: ${deleteCommunityError.message}`);
    } else {
      console.log('   ✅ Community deleted');
    }

    console.log('\n✨ Test data reset complete!\n');
    console.log('💡 Run "npm run seed:test" to create fresh test data.\n');

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
    process.exit(1);
  }
}

resetTestData();
