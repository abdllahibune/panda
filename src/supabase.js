import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zwwcelzxiqyrowrdcxwy.supabase.co'
const supabaseKey = 'sb_publishable_8k0vAAxUCBpqKLhx-bprRg_MGn679Io'

export const supabase = createClient(supabaseUrl, supabaseKey)