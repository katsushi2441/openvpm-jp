import type { OnboardingIntent } from "@/lib/onboarding/intent";
import { tx } from "@/lib/i18n";

export const CLINIC_MODELS = [
  "companion",
  "mobile",
  "equine",
  "specialty",
  "shelter",
  "exploring",
] as const;

export type ClinicModel = (typeof CLINIC_MODELS)[number];

export const DEFAULT_CLINIC_MODEL: ClinicModel = "companion";

export const FIRST_GOALS = [
  "run_visit",
  "import_records",
  "start_fresh",
  "explore_sample",
  "self_host",
] as const;

export type FirstGoal = (typeof FIRST_GOALS)[number];

export const DEFAULT_FIRST_GOAL: FirstGoal = "run_visit";

export type ClinicModelOption = {
  value: ClinicModel;
  label: string;
  shortLabel: string;
  tone: "emerald" | "coral" | "lavender" | "blue" | "rose" | "amber";
  readiness: "pilot" | "design_partner" | "explore";
};

export const CLINIC_MODEL_OPTIONS: readonly ClinicModelOption[] = [
  {
    value: "companion",
    label: tx("Companion animal clinic"),
    shortLabel: tx("Companion animal"),
    tone: "emerald",
    readiness: "pilot",
  },
  {
    value: "mobile",
    label: tx("Mobile or house-call practice"),
    shortLabel: tx("Mobile or house-call"),
    tone: "coral",
    readiness: "design_partner",
  },
  {
    value: "equine",
    label: tx("Equine or farm practice"),
    shortLabel: tx("Equine or farm"),
    tone: "lavender",
    readiness: "design_partner",
  },
  {
    value: "specialty",
    label: tx("Specialty or wellness"),
    shortLabel: tx("Specialty or wellness"),
    tone: "blue",
    readiness: "design_partner",
  },
  {
    value: "shelter",
    label: tx("Shelter or nonprofit"),
    shortLabel: tx("Shelter or nonprofit"),
    tone: "rose",
    readiness: "design_partner",
  },
  {
    value: "exploring",
    label: tx("I’m exploring"),
    shortLabel: tx("Exploring"),
    tone: "amber",
    readiness: "explore",
  },
];

export type FirstGoalOption = {
  value: FirstGoal;
  label: string;
  onboardingIntent: OnboardingIntent;
};

export const FIRST_GOAL_OPTIONS: readonly FirstGoalOption[] = [
  {
    value: "run_visit",
    label: tx("Run one real visit"),
    onboardingIntent: "alongside",
  },
  {
    value: "import_records",
    label: tx("Bring records from my current PIMS"),
    onboardingIntent: "replace",
  },
  {
    value: "start_fresh",
    label: tx("Start fresh"),
    onboardingIntent: "alongside",
  },
  {
    value: "explore_sample",
    label: tx("Explore with sample data"),
    onboardingIntent: "explore",
  },
];

export const SELF_HOST_GOAL: FirstGoalOption = {
  value: "self_host",
  label: tx("Evaluate self-hosting"),
  onboardingIntent: "self_host",
};

export function onboardingIntentForGoal(goal: FirstGoal): OnboardingIntent {
  if (goal === "self_host") return "self_host";
  return (
    FIRST_GOAL_OPTIONS.find((option) => option.value === goal)
      ?.onboardingIntent ?? "alongside"
  );
}

const MODEL_FIRST_DAY_TASKS: Record<ClinicModel, readonly string[]> = {
  companion: [
    "Review today’s schedule",
    "Add your first real client",
    "Complete one visit",
    "Review the client handoff",
  ],
  mobile: [
    "Map one house-call workflow",
    "Add a real client and patient",
    "Test a visit from your phone",
    "Review the field handoff",
  ],
  equine: [
    "Map one farm-call workflow",
    "Add an owner, animal, and location",
    "Test one low-risk visit",
    "Review the ambulatory gaps together",
  ],
  specialty: [
    "Choose your first consult type",
    "Capture the history you rely on",
    "Complete one specialty visit",
    "Plan the next follow-up",
  ],
  shelter: [
    "Map one intake workflow",
    "Add a real animal record",
    "Complete one care handoff",
    "Review team access together",
  ],
  exploring: [
    "Meet the sample clinic",
    "Open a patient timeline",
    "Walk through one visit",
    "Choose what to make yours",
  ],
};

const GOAL_FIRST_DAY_TASKS: Partial<Record<FirstGoal, readonly string[]>> = {
  import_records: [
    "Inventory your current export",
    "Preview supported record counts",
    "Review a representative chart",
    "Plan your first live visit",
  ],
  start_fresh: [
    "Set your clinic basics",
    "Add your first real client",
    "Book the first appointment",
    "Review the client handoff",
  ],
  explore_sample: [
    "Meet the sample clinic",
    "Review today’s schedule",
    "Open a patient timeline",
    "Choose what to make yours",
  ],
  self_host: [
    "Confirm your deployment path",
    "Make the workspace yours",
    "Review data ownership controls",
    "Plan your first local workflow",
  ],
};

export function firstDayTasks(
  model: ClinicModel,
  goal: FirstGoal,
): readonly string[] {
  return GOAL_FIRST_DAY_TASKS[goal] ?? MODEL_FIRST_DAY_TASKS[model];
}

export function clinicModelOption(value: ClinicModel): ClinicModelOption {
  return (
    CLINIC_MODEL_OPTIONS.find((option) => option.value === value) ??
    CLINIC_MODEL_OPTIONS[0]!
  );
}
