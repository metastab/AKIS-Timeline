import { createClient } from '@supabase/supabase-js';
import type { SystemInfo } from '../types';

/* =======================================================================================
   SUPABASE CONFIGURATION & CREDENTIALS
   =======================================================================================
   Paste your Supabase credentials in the variables below (or configure via .env file).
   
   NOTE ON KEYS:
   - For frontend/browser web apps, ALWAYS use the PUBLISHABLE KEY (sb_publishable_... or anon key).
   - NEVER use the SECRET KEY (sb_secret_... or service_role key) in client-side browser code.
     Supabase's API gateway intentionally blocks secret keys from web browsers with a 401/Forbidden.
   - If using the Publishable Key, ensure your Supabase tables have Row Level Security (RLS) policies
     configured for public access, or disable RLS for internal tracking tables:
     `ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;`
   ======================================================================================= */

// 1. YOUR SUPABASE PROJECT ID (e.g. 'bcigoossgislfoebayuf')
export const SUPABASE_PROJECT_ID: string =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';

// 2. YOUR SUPABASE PROJECT URL (e.g. 'https://bcigoossgislfoebayuf.supabase.co')
const rawUrl: string =
  import.meta.env.VITE_SUPABASE_URL ||
  (SUPABASE_PROJECT_ID !== 'YOUR_PROJECT_ID_HERE'
    ? `https://${SUPABASE_PROJECT_ID}.supabase.co`
    : 'https://YOUR_PROJECT_ID_HERE.supabase.co');

// Automatically sanitize URL to remove any accidental '/rest/v1' or trailing slashes
export const SUPABASE_URL: string = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// 3. YOUR SUPABASE PUBLISHABLE KEY (starts with 'sb_publishable_' or 'eyJ...')
export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'YOUR_PUBLISHABLE_KEY_HERE';

// Helper flag to verify if credentials have been provided
export const isConfigured = (): boolean => {
  return (
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID_HERE.supabase.co' &&
    SUPABASE_PUBLISHABLE_KEY !== 'YOUR_PUBLISHABLE_KEY_HERE' &&
    SUPABASE_URL.trim() !== '' &&
    SUPABASE_PUBLISHABLE_KEY.trim() !== ''
  );
};

// Initialize the Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* =======================================================================================
   SYSTEMS CONFIGURATION (Child Tables Mapping)
   ======================================================================================= */
export const SYSTEMS_CONFIG: SystemInfo[] = [
  {
    id: 1,
    name: 'Interaction',
    tableName: 'interaction',
    description: 'Player interaction systems, item pickups, door toggles, dialogue triggers',
    iconName: 'MousePointer',
  },
  {
    id: 2,
    name: 'Inventory',
    tableName: 'inventory',
    description: 'Item storage, equipment slots, weight calculation, quick-access hotbar',
    iconName: 'Briefcase',
  },
  {
    id: 3,
    name: 'Enemy',
    tableName: 'enemy',
    description: 'Enemy AI behavior, vision/hearing detection, patrol paths, attack states',
    iconName: 'Skull',
  },
  {
    id: 4,
    name: 'Camera',
    tableName: 'camera',
    description: 'Camera rig controls, collision clipping, field of view, dynamic smoothing',
    iconName: 'Camera',
  },
  {
    id: 5,
    name: 'Locomotion',
    tableName: 'locomotion',
    description: 'Character movement, sprint, crouch, jump, sliding, stamina mechanics',
    iconName: 'Footprints',
  },
  {
    id: 6,
    name: 'Props',
    tableName: 'props',
    description: 'World props, destructible objects, physics bodies, static environmental assets',
    iconName: 'Box',
  },
  {
    id: 7,
    name: 'Character',
    tableName: 'character',
    description: 'Character stats, health, animations, rig setup, skin customization',
    iconName: 'User',
  },
];
