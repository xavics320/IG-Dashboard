import { createClient } from '@supabase/supabase-js';

// Qui usiamo la chiave "anon" (pubblica), non la service_role del backend.
// E' sicura da esporre nel browser SOLO perche' abbiamo attivato RLS
// sulla tabella clients: senza quella policy, chiunque leggerebbe i dati
// di tutti i clienti usando questa stessa chiave.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
