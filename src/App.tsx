import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorkoutActiveSession } from './components/WorkoutActiveSession';
import { HistoryStatsView } from './components/HistoryStatsView';
import { ExerciseGuideModal } from './components/ExerciseGuideModal';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { RestTimerFloating } from './components/RestTimerFloating';
import { ProgramSelectorModal } from './components/ProgramSelectorModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { Exercise, Language, UserProfile, WorkoutSessionLog } from './types';
import {
  getAllPrograms,
  getActiveProgramId,
  setActiveProgramId,
  getNextWorkoutIndex,
  getWorkoutLogs,
  deleteWorkoutLog,
  getUserProfile,
  saveUserProfile,
} from './utils/storage';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('styrka_lang_v1');
      if (saved === 'en' || saved === 'sv') return saved;
    } catch (e) {}
    return 'sv';
  });

  const [activeView, setActiveView] = useState<'workout' | 'history'>('workout');

  // Programs & Active Cycle
  const [programs, setPrograms] = useState(() => getAllPrograms());
  const [activeProgramId, setActiveProgId] = useState(() => getActiveProgramId());
  const currentProgram =
    programs.find((p) => p.id === activeProgramId) || programs[0];

  // Logs & History
  const [logs, setLogs] = useState<WorkoutSessionLog[]>(() => getWorkoutLogs());

  // Automatic workout cycling (e.g. Workout A -> Workout B)
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(() =>
    getNextWorkoutIndex(currentProgram)
  );

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());

  // Modals & Sheets
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  const [plateCalcData, setPlateCalcData] = useState<{
    weightKg: number;
    onApply?: (w: number) => void;
  } | null>(null);
  const [isProgramSelectorOpen, setIsProgramSelectorOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);

  // Language persist
  useEffect(() => {
    try {
      localStorage.setItem('styrka_lang_v1', lang);
    } catch (e) {}
  }, [lang]);

  // Recalculate cycle when program changes
  const handleSelectProgram = (progId: string) => {
    setActiveProgramId(progId);
    setActiveProgId(progId);
    const prog = programs.find((p) => p.id === progId) || programs[0];
    setActiveWorkoutIndex(getNextWorkoutIndex(prog));
  };

  const handleWorkoutFinished = () => {
    const updatedLogs = getWorkoutLogs();
    setLogs(updatedLogs);
    // Cycle automatically to next workout in sequence
    setActiveWorkoutIndex(getNextWorkoutIndex(currentProgram));
    setActiveView('history');
  };

  const handleDeleteLog = (id: string) => {
    deleteWorkoutLog(id);
    setLogs(getWorkoutLogs());
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-iron-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentProgram={currentProgram}
        profile={profile}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenProgramSelector={() => setIsProgramSelectorOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        lang={lang}
        onLanguageChange={setLang}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        {activeView === 'workout' ? (
          <WorkoutActiveSession
            program={currentProgram}
            activeWorkoutIndex={activeWorkoutIndex}
            onWorkoutIndexChange={setActiveWorkoutIndex}
            onOpenGuide={(ex) => setGuideExercise(ex)}
            onOpenPlateCalc={(weight, onApply) =>
              setPlateCalcData({ weightKg: weight, onApply })
            }
            onTriggerRestTimer={(secs) => setActiveRestSeconds(secs)}
            onWorkoutFinished={handleWorkoutFinished}
            lang={lang}
          />
        ) : (
          <HistoryStatsView
            logs={logs}
            onDeleteLog={handleDeleteLog}
            lang={lang}
          />
        )}
      </main>

      {/* Floating Rest Timer */}
      {activeRestSeconds !== null && (
        <RestTimerFloating
          initialSeconds={activeRestSeconds}
          onDismiss={() => setActiveRestSeconds(null)}
          lang={lang}
        />
      )}

      {/* Exercise Guide Modal (Discreet form cues & instructions behind button) */}
      <ExerciseGuideModal
        exercise={guideExercise}
        isOpen={!!guideExercise}
        onClose={() => setGuideExercise(null)}
        lang={lang}
      />

      {/* Barbell Plate Calculator Modal */}
      {plateCalcData && (
        <PlateCalculatorModal
          initialWeightKg={plateCalcData.weightKg}
          isOpen={true}
          onClose={() => setPlateCalcData(null)}
          onApplyWeight={plateCalcData.onApply}
          lang={lang}
        />
      )}

      {/* Program Selector Modal */}
      <ProgramSelectorModal
        programs={programs}
        activeProgramId={activeProgramId}
        isOpen={isProgramSelectorOpen}
        onClose={() => setIsProgramSelectorOpen(false)}
        onSelectProgram={handleSelectProgram}
        lang={lang}
      />

      {/* Cloud Sync & Profile Modal */}
      <CloudSyncModal
        profile={profile}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
        lang={lang}
      />

      {/* Minimal Craft Footer */}
      <footer className="border-t border-iron-800/60 py-6 text-center text-xs text-iron-500">
        <p>
          Styrka — Harkco Daily Apps • Byggd för lyftare och partners
        </p>
      </footer>
    </div>
  );
}

export default App;
