/**
 * Script to seed test member data for local development
 * Run with: npx tsx scripts/seed-test-data.ts
 * 
 * This bypasses Whop API and creates fake members directly in Supabase
 * so you can test campaigns without needing a real Whop community with members
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const TEST_COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_P7GaxZAjHSg2OL';
const NUM_MEMBERS = 50;

console.log(`📍 Using Company ID: ${TEST_COMPANY_ID}`);

// Member tiers and statuses for realistic test data
const TIERS = ['basic', 'premium', 'vip', 'elite'];
const STATUSES = ['active', 'cancelled', 'paused'];
const NAMES = [
  'Alex Johnson', 'Sam Williams', 'Jordan Brown', 'Casey Davis', 
  'Morgan Wilson', 'Taylor Martinez', 'Riley Anderson', 'Jamie Thomas',
  'Avery Garcia', 'Quinn Rodriguez', 'Dakota Hernandez', 'Skylar Moore',
  'River Martin', 'Phoenix Lee', 'Sage Walker', 'Rowan Hall'
];

/**
 * Generate realistic test member data
 */
function generateTestMembers(communityId: number, count: number) {
  const members = [];
  
  for (let i = 1; i <= count; i++) {
    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const firstName = randomName.split(' ')[0].toLowerCase();
    
    members.push({
      community_id: communityId,
      whop_member_id: `mem_test_${crypto.randomUUID()}`,
      email: `${firstName}${i}@testmembermail.dev`,
      name: `${randomName} ${i}`,
      membership_tier: TIERS[i % TIERS.length],
      // 80% active, 15% cancelled, 5% paused (realistic distribution)
      status: i % 20 === 0 ? 'paused' : i % 7 === 0 ? 'cancelled' : 'active',
      joined_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_active_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      engagement_score: Math.floor(Math.random() * 100),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  return members;
}

/**
 * Main seeding function
 */
async function seedTestData() {
  console.log('🌱 Starting test data seed...\n');
  
  try {
    // Step 1: Get or create a test profile
    console.log('📝 Step 1: Getting existing profile...');
    
    // First, try to get an existing profile
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(1);
    
    let finalUserId: string;
    
    if (existingProfiles && existingProfiles.length > 0) {
      // Use the first existing profile
      finalUserId = existingProfiles[0].id;
      console.log(`✅ Using existing profile: ${existingProfiles[0].email} (ID: ${finalUserId})\n`);
    } else {
      // No existing profiles, try to create one
      console.log('⚠️  No existing profiles found. Creating test profile...');
      console.log('   Note: This requires the profile to have a matching auth.users record.\n');
      
      const testUserId = crypto.randomUUID();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'testadmin@membermail.dev',
          name: 'Test Admin',
        })
        .select()
        .single();
        
      if (profileError) {
        console.error('❌ Failed to create profile. This usually means:');
        console.error('   1. The profiles table has a foreign key to auth.users');
        console.error('   2. You need to sign up a user first through your app\n');
        console.error(`   Error: ${profileError.message}\n`);
        console.error('💡 Solution: Sign up through your app first, then run this script again.\n');
        throw new Error('No valid user profile found');
      }
      
      finalUserId = profile!.id;
      console.log(`✅ Profile created: ${finalUserId}\n`);
    }
    
    // Step 2: Create test community
    console.log('🏢 Step 2: Creating test community...');
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .upsert({
        whop_community_id: TEST_COMPANY_ID,
        name: 'Test Community - MemberMail Dev',
        user_id: finalUserId,
        member_count: NUM_MEMBERS,
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'whop_community_id' })
      .select()
      .single();
      
    if (communityError) {
      throw new Error(`Failed to create community: ${communityError.message}`);
    }
    
    console.log(`✅ Community created: ${community.name} (ID: ${community.id})\n`);
    
    // Step 3: Delete existing test members (clean slate)
    console.log('🧹 Step 3: Cleaning existing test members...');
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('community_id', community.id);
      
    if (deleteError) {
      console.warn(`⚠️  Warning: Failed to delete existing members: ${deleteError.message}`);
    } else {
      console.log('✅ Existing members cleaned\n');
    }
    
    // Step 4: Generate and insert test members
    console.log(`👥 Step 4: Generating ${NUM_MEMBERS} test members...`);
    const testMembers = generateTestMembers(community.id, NUM_MEMBERS);
    
    const { data: insertedMembers, error: membersError } = await supabase
      .from('members')
      .insert(testMembers)
      .select();
      
    if (membersError) {
      throw new Error(`Failed to insert members: ${membersError.message}`);
    }
    
    console.log(`✅ ${insertedMembers?.length || 0} members created\n`);
    
    // Step 5: Show summary
    console.log('📊 Summary:');
    const activeCount = testMembers.filter(m => m.status === 'active').length;
    const cancelledCount = testMembers.filter(m => m.status === 'cancelled').length;
    const pausedCount = testMembers.filter(m => m.status === 'paused').length;
    
    console.log(`   Total Members: ${testMembers.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Cancelled: ${cancelledCount}`);
    console.log(`   Paused: ${pausedCount}`);
    console.log(`\n   Community ID: ${TEST_COMPANY_ID}`);
    console.log(`   Database Community ID: ${community.id}`);
    
    console.log('\n✨ Test data seeded successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Navigate to your MemberMail dashboard');
    console.log('   2. Create a new campaign');
    console.log(`   3. Select "All Members" audience (${activeCount} recipients)`);
    console.log('   4. Test your email sending flow\n');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the script
seedTestData();
