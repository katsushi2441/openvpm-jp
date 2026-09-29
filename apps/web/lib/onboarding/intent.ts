import { tx } from "@/lib/i18n";
export const ONBOARDING_INTENTS = [
  "alongside",
  "replace",
  "explore",
  "self_host",
] as const;

export type OnboardingIntent = (typeof ONBOARDING_INTENTS)[number];

export const DEFAULT_ONBOARDING_INTENT: OnboardingIntent = "alongside";

/**
 * Set expectations after signup, before a clinic invests time configuring the
 * workspace. This checkpoint is intentionally not on the registration form:
 * it qualifies the hosted clinic pilot without adding friction to account
 * creation or overstating capabilities that still require validation.
 */
export const HOSTED_CLINIC_PILOT = {
  recommendedFit:
    "A companion-animal clinic starting with one location, a small team, and one real, low-risk visit alongside its current system.",
  firstUsefulDay:
    "Move one real client and pet through an appointment, clinical handoff, charges (or no-charge), and checkout.",
  guardrails: [
    "Keep your current PIMS as the source of truth until your team validates its workflow and export.",
    "Plan to use OpenVPM online; offline changes stay only in the current tab and cannot be relied on after a close or reload.",
    "Texting requires separate controlled activation and should not be assumed available.",
    "Herd and large-animal workflows and turnkey third-party integrations are outside this clinic pilot.",
  ],
} as const;

export type OnboardingIntentOption = {
  value: OnboardingIntent;
  label: string;
  shortLabel: string;
  description: string;
  firstWin: string;
  firstWinHint: string;
  firstWinTarget: "tour" | "brand" | "data";
  recommended?: boolean;
};

export const ONBOARDING_INTENT_OPTIONS: readonly OnboardingIntentOption[] = [
  {
    value: "alongside",
    label: tx("Run alongside my current PIMS"),
    shortLabel: tx("Alongside current PIMS"),
    description:
      tx("Start with one useful workflow while your current system stays in place."),
    firstWin: tx("Bring over a small real dataset"),
    firstWinHint:
      tx("Start with a few clients and pets. Your current PIMS stays in place."),
    firstWinTarget: "data",
    recommended: true,
  },
  {
    value: "replace",
    label: tx("Replace my current PIMS"),
    shortLabel: tx("Replace current PIMS"),
    description:
      tx("Prepare a staged move of your clinic data and day-to-day workflows."),
    firstWin: tx("Start your staged data import"),
    firstWinHint:
      tx("Bring clients and pets in before switching live clinic workflows."),
    firstWinTarget: "data",
  },
  {
    value: "explore",
    label: tx("Explore with sample data"),
    shortLabel: tx("Explore"),
    description:
      tx("Learn the product first with a ready-made clinic and no migration decision."),
    firstWin: tx("Take the 60-second tour"),
    firstWinHint: tx("See the schedule, records, billing, and AI in a minute."),
    firstWinTarget: "tour",
  },
  {
    value: "self_host",
    label: tx("Evaluate for self-hosting"),
    shortLabel: tx("Self-host"),
    description:
      tx("Learn the same open-source product while you plan or run your own deployment."),
    firstWin: tx("Brand your self-hosted workspace"),
    firstWinHint:
      tx("Set clinic details first; hosted-only billing steps stay out of self-hosted setup."),
    firstWinTarget: "brand",
  },
];

export function isOnboardingIntent(value: unknown): value is OnboardingIntent {
  return ONBOARDING_INTENTS.includes(value as OnboardingIntent);
}

export function getOnboardingIntentOption(
  value: unknown,
): OnboardingIntentOption {
  return (
    ONBOARDING_INTENT_OPTIONS.find((option) => option.value === value) ??
    ONBOARDING_INTENT_OPTIONS[0]!
  );
}

export function onboardingIntentLabel(value: unknown): string {
  if (!isOnboardingIntent(value)) return "Not selected";
  return getOnboardingIntentOption(value).shortLabel;
}
