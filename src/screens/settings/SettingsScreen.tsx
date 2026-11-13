import { useEffect, useState } from 'react';
import { getProfile, latestWeight, saveProfile } from '../../db/repo';
import { Screen } from '../../ui/Screen';
import { ListRow, ListSection } from '../../ui/List';
import { useToast } from '../../ui/Toast';
import { ProfileForm, draftToProfile, type ProfileDraft } from './ProfileForm';
import { TargetsCard } from './TargetsCard';
import { AiSettings } from './AiSettings';
import { BackupSettings } from './BackupSettings';

export default function SettingsScreen() {
  const toast = useToast();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);

  useEffect(() => {
    void Promise.all([getProfile(), latestWeight()]).then(([p, w]) => {
      if (!p) return;
      setDraft({ sex: p.sex, birthDate: p.birthDate, heightCm: p.heightCm, weightKg: w?.kg ?? 70, activity: p.activity, goal: p.goal, rateKgPerWeek: p.rateKgPerWeek });
    });
  }, []);

  async function saveDraft() {
    const ok = draft && draftToProfile(draft);
    const current = await getProfile();
    if (!ok || !current) return;
    await saveProfile({ ...ok.profile, ...(current.manualTargets ? { manualTargets: current.manualTargets } : {}) });
    toast.show('Perfil guardado');
  }

  return (
    <Screen title="Ajustes">
      <TargetsCard editable />
      {draft && (
        <>
          <ProfileForm draft={draft} onChange={setDraft} showWeight={false} />
          <ListSection>
            <ListRow tone="action" title="Guardar perfil" onClick={saveDraft} disabled={!draftToProfile(draft)} />
          </ListSection>
        </>
      )}
      <AiSettings />
      <BackupSettings />
      <p className="t-footnote c-secondary" style={{ textAlign: 'center', margin: '0 16px' }}>
        Comidia · tus datos quedan en este teléfono. El peso se registra en Progreso.
      </p>
    </Screen>
  );
}
