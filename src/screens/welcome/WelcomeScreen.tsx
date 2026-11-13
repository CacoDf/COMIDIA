import { useState } from 'react';
import { useNavigate } from 'react-router';
import { saveProfile, setWeight } from '../../db/repo';
import { todayLocal } from '../../domain/dates';
import { targetsFor } from '../../state/useTargets';
import { Screen } from '../../ui/Screen';
import { Button } from '../../ui/Button';
import { ProfileForm, draftToProfile, emptyDraft, type ProfileDraft } from '../settings/ProfileForm';
import { TargetsCard } from '../settings/TargetsCard';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const ready = draftToProfile(draft);
  const targets = ready ? targetsFor(ready.profile, ready.weightKg) : undefined;

  async function start() {
    if (!ready) return;
    setSaving(true);
    await saveProfile(ready.profile);
    await setWeight(todayLocal(), ready.weightKg);
    navigate('/', { replace: true });
  }

  return (
    <Screen title="Hola" tabbar={false} subtitle="Cuéntanos de ti para que Comidia calcule cuánto comer cada día.">
      <ProfileForm draft={draft} onChange={setDraft} />
      {targets && <TargetsCard targets={targets} />}
      <Button size="large" onClick={start} disabled={!ready} loading={saving}>Empezar</Button>
      <p className="t-footnote c-secondary" style={{ textAlign: 'center', margin: '12px 8px 0' }}>
        Tus datos quedan solo en este teléfono. La IA se activa después en Ajustes.
      </p>
    </Screen>
  );
}
