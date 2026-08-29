import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function Dashboard({ session }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadClient();
  }, []);

  async function loadClient() {
    setLoading(true);
    // Grazie alla policy RLS "clients_select_own", questa query restituisce
    // automaticamente solo la riga collegata all'utente loggato: non serve
    // nemmeno filtrare esplicitamente per auth_user_id, il database lo fa da solo.
    const { data, error } = await supabase.from('clients').select('*').single();

    if (error) {
      console.error(error);
    } else {
      setClient(data);
      setLogoPreview(data.logo_url);
    }
    setLoading(false);
  }

  function updateField(field, value) {
    setClient((prev) => ({ ...prev, [field]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    let logoUrl = client.logo_url;

    if (logoFile) {
      const filename = `${client.id}-${Date.now()}-${logoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filename, logoFile, { upsert: true });

      if (uploadError) {
        setSaveMessage({ type: 'error', text: `Errore caricamento logo: ${uploadError.message}` });
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('brand-assets').getPublicUrl(filename);
      logoUrl = publicUrlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        brand_description: client.brand_description,
        posts_per_week: client.posts_per_week,
        style_bg_color: client.style_bg_color,
        style_text_color: client.style_text_color,
        style_accent_color: client.style_accent_color,
        telegram_chat_id: client.telegram_chat_id,
        logo_url: logoUrl,
      })
      .eq('id', client.id);

    setSaving(false);

    if (updateError) {
      setSaveMessage({ type: 'error', text: `Errore salvataggio: ${updateError.message}` });
    } else {
      setSaveMessage({ type: 'success', text: 'Impostazioni salvate.' });
      setClient((prev) => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <div className="loading-screen">Caricamento...</div>;
  if (!client) {
    return (
      <div className="loading-screen">
        Nessun profilo cliente collegato a questo account. Contatta il tuo referente.
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <img src="/logo-webdev-xp-transparent.png" alt="Agent XP" className="brand-mark small" />
        <h1>{client.name}</h1>
        <button className="btn-secondary" onClick={handleLogout}>
          Esci
        </button>
      </header>

      <form className="settings-form" onSubmit={handleSave}>
        <section>
          <h2>Brand</h2>
          <label htmlFor="brand_description">Descrizione del brand</label>
          <textarea
            id="brand_description"
            rows={3}
            value={client.brand_description}
            onChange={(e) => updateField('brand_description', e.target.value)}
          />
          <p className="field-hint">
            Descrivi in poche frasi chi sei e cosa fai: verrà usato per generare i contenuti.
          </p>
        </section>

        <section>
          <h2>Frequenza di pubblicazione</h2>
          <label htmlFor="posts_per_week">Post a settimana</label>
          <input
            id="posts_per_week"
            type="number"
            min={1}
            max={7}
            value={client.posts_per_week}
            onChange={(e) => updateField('posts_per_week', Number(e.target.value))}
          />
        </section>

        <section>
          <h2>Identità visiva</h2>
          <div className="color-row">
            <div className="color-field">
              <label htmlFor="bg_color">Sfondo</label>
              <input
                id="bg_color"
                type="color"
                value={client.style_bg_color}
                onChange={(e) => updateField('style_bg_color', e.target.value)}
              />
              <span>{client.style_bg_color}</span>
            </div>
            <div className="color-field">
              <label htmlFor="text_color">Testo</label>
              <input
                id="text_color"
                type="color"
                value={client.style_text_color}
                onChange={(e) => updateField('style_text_color', e.target.value)}
              />
              <span>{client.style_text_color}</span>
            </div>
            <div className="color-field">
              <label htmlFor="accent_color">Accento</label>
              <input
                id="accent_color"
                type="color"
                value={client.style_accent_color}
                onChange={(e) => updateField('style_accent_color', e.target.value)}
              />
              <span>{client.style_accent_color}</span>
            </div>
          </div>

          <label htmlFor="logo">Logo</label>
          {logoPreview && <img src={logoPreview} alt="Anteprima logo" className="logo-preview" />}
          <input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
        </section>

        <section>
          <h2>Telegram</h2>
          <label htmlFor="telegram_chat_id">Chat ID</label>
          <input
            id="telegram_chat_id"
            type="text"
            value={client.telegram_chat_id || ''}
            onChange={(e) => updateField('telegram_chat_id', e.target.value)}
          />
          <p className="field-hint">
            Scrivi al bot e chiedi al tuo referente di aiutarti a trovare questo codice se non lo conosci.
          </p>
        </section>

        <section>
          <h2>Instagram</h2>
          <p className="connection-status">
            {client.ig_access_token ? (
              <span className="status-ok">● Account collegato</span>
            ) : (
              <span className="status-off">● Non ancora collegato — contatta il tuo referente</span>
            )}
          </p>
        </section>

        {saveMessage && (
          <p className={saveMessage.type === 'error' ? 'error-text' : 'success-text'}>
            {saveMessage.text}
          </p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </form>
    </div>
  );
}
