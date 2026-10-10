import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { syncWithCloudServer, saveUserProfile } from '../utils/storage';
import { X, Cloud, Lock, User, Check, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import { playClick, playIronClick } from '../utils/audio';

interface CloudSyncModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
  lang: Language;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
  lang,
}) => {
  const [username, setUsername] = useState(profile.username || 'viktor');
  const [pin, setPin] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginOrSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || pin.length < 4) {
      setErrorMessage(
        lang === 'sv'
          ? 'Ange ett användarnamn och en minst 4-siffrig PIN-kod'
          : 'Please enter a username and at least 4-digit PIN'
      );
      return;
    }

    setErrorMessage('');
    setIsSyncing(true);

    try {
      const success = await syncWithCloudServer(username.trim().toLowerCase(), pin);
      if (success) {
        playIronClick();
        setSuccessMessage(
          lang === 'sv'
            ? 'Synkad mot databasen! Dina träningspass är säkra.'
            : 'Synced to cloud database! Your workout data is backed up.'
        );
        const updated: UserProfile = {
          ...profile,
          username: username.trim().toLowerCase(),
          displayName: username.trim().charAt(0).toUpperCase() + username.trim().slice(1),
          isCloudSynced: true,
        };
        onProfileUpdated(updated);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(
          lang === 'sv'
            ? 'Kunde inte synka. Kontrollera PIN-koden om kontot redan finns.'
            : 'Could not sync. Check PIN if the account already exists.'
        );
      }
    } catch (err) {
      setErrorMessage(lang === 'sv' ? 'Nätverksfel vid synkning' : 'Network error during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    playClick();
    const updated: UserProfile = {
      ...profile,
      isCloudSynced: false,
    };
    saveUserProfile(updated);
    onProfileUpdated(updated);
    setSuccessMessage(lang === 'sv' ? 'Frånkopplad från molnet' : 'Disconnected from cloud');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full bg-iron-900 border border-iron-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-iron-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'sv' ? 'Databas & Säkerhetskopia' : 'Database & Cloud Backup'}
              </h3>
              <p className="text-xs text-iron-400">
                {lang === 'sv'
                  ? 'Spara dina träningsresultat tryggt i molnet'
                  : 'Save your workout results securely to the database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-iron-400 hover:text-white hover:bg-iron-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div className="p-4 rounded-2xl bg-iron-950 border border-iron-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-iron-400 uppercase tracking-wider text-[10px]">
              {lang === 'sv' ? 'Synkstatus' : 'Sync Status'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] flex items-center gap-1 ${
                profile.isCloudSynced
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-iron-800 text-iron-400 border border-iron-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-iron-500'
                }`}
              />
              {profile.isCloudSynced
                ? lang === 'sv'
                  ? 'Aktiv i molnet'
                  : 'Cloud Active'
                : lang === 'sv'
                ? 'Lokal på telefonen'
                : 'Local Device Only'}
            </span>
          </div>

          <p className="text-iron-300 leading-relaxed">
            {profile.isCloudSynced
              ? lang === 'sv'
                ? `Inloggad som "${profile.username}". Alla pass och personbästan sparas automatiskt i databasen.`
                : `Logged in as "${profile.username}". All workouts and PRs are automatically synced to the server database.`
              : lang === 'sv'
              ? 'Dina pass sparas lokalt. Logga in för att aldrig förlora historik vid telefonbyte och för att dela appen med din partner.'
              : 'Your workouts are currently stored locally. Log in to keep history safe across devices and share with your partner.'}
          </p>
        </div>

        {/* Quick Profile Suggestions */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Snabbval för profil' : 'Quick profile presets'}
          </span>
          <div className="flex items-center gap-2">
            {['viktor', 'anna', 'partner'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  playClick();
                  setUsername(name);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                  username.toLowerCase() === name
                    ? 'bg-amber-500 text-iron-950 shadow-sm'
                    : 'bg-iron-950 border border-iron-800 text-iron-300 hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Sync / Login Form */}
        <form onSubmit={handleLoginOrSync} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
              {lang === 'sv' ? 'Användarnamn / Profil' : 'Username / Profile'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="T.ex. viktor"
                className="w-full bg-iron-950 border border-iron-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              />
              <User className="w-4 h-4 text-iron-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
              {lang === 'sv' ? '4-siffrig PIN-kod' : '4-digit PIN'}
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-iron-950 border border-iron-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white tracking-widest focus:outline-none focus:border-amber-500"
              />
              <Lock className="w-4 h-4 text-iron-500 absolute right-3 top-2.5" />
            </div>
            <p className="text-[11px] text-iron-500">
              {lang === 'sv'
                ? 'Första gången du loggar in med ett namn skapas kontot automatiskt med vald PIN.'
                : 'Logging in with a new username automatically registers it with this PIN.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2">
            {profile.isCloudSynced && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2.5 rounded-xl border border-iron-800 text-iron-400 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'sv' ? 'Logga ut' : 'Log out'}</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-iron-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {profile.isCloudSynced
                  ? lang === 'sv'
                    ? 'Synka & Uppdatera'
                    : 'Sync & Update'
                  : lang === 'sv'
                  ? 'Aktivera Molnsynk'
                  : 'Activate Cloud Sync'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
