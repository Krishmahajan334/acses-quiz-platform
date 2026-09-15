import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground uppercase tracking-tight">Registration Settings</h2>
        <p className="text-muted-foreground mt-2">Configure dynamic settings for the registration page.</p>
      </div>

      <SettingsClient />
    </div>
  );
}
