import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = ancora in caricamento

  useEffect(() => {
    // Controlla se esiste gia' una sessione salvata (utente gia' loggato in precedenza)
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Si iscrive ai cambiamenti di stato (login/logout), cosi' l'interfaccia
    // si aggiorna automaticamente senza bisogno di ricaricare la pagina
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="loading-screen">Caricamento...</div>;
  }

  return session ? <Dashboard session={session} /> : <Login />;
}
