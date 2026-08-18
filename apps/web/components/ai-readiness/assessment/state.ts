/**
 * Assessment intake state.
 *
 * One flat, serialisable object drives every screen of the entry flow, and it
 * is mirrored into sessionStorage after each change so a refresh — or a step
 * back — never loses an answer. Keeping it plain data (no classes, no
 * context) is deliberate: when the backend and the AI assistant arrive, this
 * is the payload they receive.
 */

export type AssessmentMode = 'quick' | 'full' | 'org';

export type IntakeKey = 'industry' | 'size' | 'role' | 'aiStage' | 'orgName';

export type IntakeState = {
  mode: AssessmentMode | null;
  industry: string | null;
  size: string | null;
  role: string | null;
  aiStage: string | null;
  orgName: string;
};

export const emptyIntake: IntakeState = {
  mode: null,
  industry: null,
  size: null,
  role: null,
  aiStage: null,
  orgName: '',
};

const STORAGE_KEY = 'paapeli:ai-readiness:intake';

export function loadIntake(): IntakeState {
  if (typeof window === 'undefined') return emptyIntake;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyIntake;
    // Spread over the defaults so a stored object written by an older build
    // cannot leave a newly added field undefined.
    return { ...emptyIntake, ...(JSON.parse(raw) as Partial<IntakeState>) };
  } catch {
    return emptyIntake;
  }
}

export function saveIntake(state: IntakeState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private-browsing quotas and disabled storage are not worth failing over;
    // the flow still works, it just will not survive a refresh.
  }
}

/** Every intake step except the optional organisation name must be answered. */
export function isIntakeComplete(state: IntakeState): boolean {
  return Boolean(state.industry && state.size && state.role && state.aiStage);
}
