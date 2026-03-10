
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) {
        console.error(error);
        return;
    }
    console.log('Payments:', JSON.stringify(data, null, 2));
}

check();
