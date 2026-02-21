import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dprlkkbeojfbhdaelpty.supabase.co';
const supabaseAnonKey = 'sb_publishable_NzeDVlRjQr0vYYBqqBeEeA_W8iRIITR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
