/**
 * One-time script to seed members for a specific experience ID
 * Run with: npx tsx scripts/seed-for-experience.ts exp_xvsDihdCrOCXTL
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

// Get experience ID from command line argument
const experienceId = process.argv[2];

if (!experienceId) {
  console.error('❌ Please provide an experience ID');
  console.error('   Usage: npx tsx scripts/seed-for-experience.ts exp_xvsDihdCrOCXTL');
  process.exit(1);
}

const NUM_MEMBERS = 50;
const TIERS = ['basic', 'premium', 'vip', 'elite'];
const NAMES = [
  'Alex Johnson', 'Sam Williams', 'Jordan Brown', 'Casey Davis', 
  'Morgan Wilson', 'Taylor Martinez', 'Riley Anderson', 'Jamie Thomas',
  'Avery Garcia', 'Quinn Rodriguez', 'Dakota Hernandez', 'Skylar Moore',
  'River Martin', 'Phoenix Lee', 'Sage Walker', 'Rowan Hall'
];

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

async function seedForExperience() {
  console.log(`🌱 Seeding members for experience: ${experienceId}\n`);
  
  try {
    // Get existing profile
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(1);
    
    if (!existingProfiles || existingProfiles.length === 0) {
      console.error('❌ No profiles found. Please sign up through your app first.');
      process.exit(1);
    }
    
    const userId = existingProfiles[0].id;
    console.log(`✅ Using profile: ${existingProfiles[0].email}\n`);
    
    // Create or update community for this experience
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .upsert({
        whop_community_id: experienceId,
        name: `Experience ${experienceId}`,
        user_id: userId,
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
    
    console.log(`✅ Community created/updated (ID: ${community.id})\n`);
    
    // Clean existing members
    await supabase.from('members').delete().eq('community_id', community.id);
    console.log('🧹 Cleaned existing members\n');
    
    // Generate and insert test members
    console.log(`👥 Generating ${NUM_MEMBERS} test members...`);
    const testMembers = generateTestMembers(community.id, NUM_MEMBERS);
    
    const { data: insertedMembers, error: membersError } = await supabase
      .from('members')
      .insert(testMembers)
      .select();
      
    if (membersError) {
      throw new Error(`Failed to insert members: ${membersError.message}`);
    }
    
    console.log(`✅ ${insertedMembers?.length || 0} members created\n`);
    
    // Summary
    const activeCount = testMembers.filter(m => m.status === 'active').length;
    const cancelledCount = testMembers.filter(m => m.status === 'cancelled').length;
    const pausedCount = testMembers.filter(m => m.status === 'paused').length;
    
    console.log('📊 Summary:');
    console.log(`   Experience ID: ${experienceId}`);
    console.log(`   Total Members: ${testMembers.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Cancelled: ${cancelledCount}`);
    console.log(`   Paused: ${pausedCount}\n`);
    
    console.log('✨ Done! Your campaign composer should now show members.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedForExperience();
