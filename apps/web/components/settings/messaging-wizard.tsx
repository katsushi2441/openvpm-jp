"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  defaultMessagingSetupMode,
  setupModeTitle,
  type MessagingSetupMode,
} from "@/lib/messaging/setup-wizard";
import {
  isMessagingAreaCodeInputValid,
  MESSAGING_AREA_CODE_LENGTH,
} from "@/lib/messaging/policy";
import { toast } from "sonner";
import { tx, uiLocale, txv } from "@/lib/i18n";

export type MessagingSetupLocation = {
  locationId: string;
  name: string;
  isPrimary: boolean;
  existingPhone: string | null;
  messaging: {
    senderE164: string | null;
    messagingProfileId: string | null;
    numberSource: "hosted" | "purchased" | "toll_free" | null;
    registrationStatus:
      | "not_started"
      | "pending"
      | "active"
      | "action_required"
      | "failed"
      | "suspended";
    registrationDetail: string | null;
    providerProfileReady?: boolean;
    providerProfileSyncedAt?: Date | string | null;
    providerProfileAttestationFresh?: boolean;
    enabled: boolean;
    launchEligible?: boolean;
  } | null;
};

type Step = "choose" | "confirm" | "registration" | "done";
type SearchNumber = {
  phoneNumber: string;
  upfrontCost: string;
  monthlyCost: string;
  currency: string;
};

/** Format a provider's raw cost (e.g. "1.00000") using its quoted currency. */
function formatCost(cost: string, currency: string): string {
  const value = Number(cost);
  if (!Number.isFinite(value)) return `${cost} ${currency}`;
  try {
    return new Intl.NumberFormat(uiLocale(), {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

const STEPS: { id: Step; title: string }[] = [
  { id: "choose", title: tx("Choose a texting number") },
  { id: "confirm", title: tx("Confirm the number") },
  { id: "registration", title: tx("Review and purchase") },
  { id: "done", title: tx("Number ordered; registration not started") },
];

export function MessagingWizard({
  location,
  hosted,
  open,
  onOpenChange,
  onChanged,
}: {
  location: MessagingSetupLocation | null;
  hosted: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const utils = trpc.useUtils();
  const defaultMode = useMemo(
    () => defaultMessagingSetupMode(location?.existingPhone),
    [location?.existingPhone],
  );
  const [step, setStep] = useState<Step>("choose");
  const [mode, setMode] = useState<MessagingSetupMode>(defaultMode);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    detail?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<SearchNumber[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<SearchNumber | null>(
    null,
  );
  const [provisionedSender, setProvisionedSender] = useState<string | null>(
    null,
  );
  const [chargeAcknowledged, setChargeAcknowledged] = useState(false);

  useEffect(() => {
    if (!open || !location) return;
    setStep("choose");
    setMode(defaultMessagingSetupMode(location.existingPhone));
    setEligibility(null);
    setChecking(false);
    setAreaCode("");
    setNumbers([]);
    setHasSearched(false);
    setSelectedNumber(null);
    setProvisionedSender(null);
    setChargeAcknowledged(false);
  }, [open, location]);

  const provision = trpc.messaging.provisionNumber.useMutation({
    onSuccess: (result) => {
      setProvisionedSender(result.senderE164);
      setStep("done");
      toast.success(
        tx("Number order accepted. Sending stays off until carrier approval."),
      );
      onChanged();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!open || !location) return null;
  const activeLocation = location;

  const currentIndex = STEPS.findIndex((s) => s.id === step);
  const canContinue =
    step === "choose" ||
    step === "done" ||
    (step === "confirm" &&
      ((mode === "host" && eligibility?.eligible === true) ||
        (mode === "buy" && Boolean(selectedNumber)))) ||
    (step === "registration" &&
      mode === "buy" &&
      Boolean(selectedNumber) &&
      chargeAcknowledged);

  async function checkExisting() {
    if (!location) return;
    setChecking(true);
    try {
      const result = await utils.messaging.checkEligibility.fetch({
        locationId: location.locationId,
      });
      setEligibility(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eligibility check failed");
    } finally {
      setChecking(false);
    }
  }

  async function searchNumbers() {
    if (!isMessagingAreaCodeInputValid(areaCode)) return;
    setChecking(true);
    setChargeAcknowledged(false);
    setSelectedNumber(null);
    setHasSearched(false);
    try {
      const result = await utils.messaging.searchNumbers.fetch(
        areaCode ? { areaCode } : {},
      );
      setNumbers(result);
      setSelectedNumber(result[0] ?? null);
      setHasSearched(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Number search failed");
    } finally {
      setChecking(false);
    }
  }

  function handleContinue() {
    if (step === "choose") {
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (mode === "host" && eligibility === null) {
        void checkExisting();
        return;
      }
      if (mode === "buy" && numbers.length === 0) {
        void searchNumbers();
        return;
      }
      setStep("registration");
      return;
    }
    if (step === "registration") {
      if (mode !== "buy" || !selectedNumber || !chargeAcknowledged) return;
      provision.mutate({
        locationId: activeLocation.locationId,
        mode: "buy",
        action: "start",
        phoneNumber: selectedNumber.phoneNumber,
        quote: {
          upfrontCost: selectedNumber.upfrontCost,
          monthlyCost: selectedNumber.monthlyCost,
          currency: selectedNumber.currency,
        },
        confirmProviderCharges: true,
      });
      return;
    }
    onOpenChange(false);
  }

  function handleBack() {
    if (step === "choose" || provision.isPending) return;
    const previous = STEPS[Math.max(0, currentIndex - 1)]?.id ?? "choose";
    setStep(previous);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tx("Set up texting")}
      className="fixed inset-0 z-[90] overflow-y-auto bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_52%,#f0fdfa_100%)] p-4 text-slate-950 sm:p-6"
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-white/80 bg-white p-6 shadow-xl shadow-emerald-200/30 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <MessageSquare className="h-4 w-4" />{tx("Texting setup")}</div>
              <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-slate-950">
                {txv(STEPS[currentIndex]?.title)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {location.name}
                {location.isPrimary ? tx(" primary location") : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label={tx("Close texting setup")}
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= currentIndex ? "bg-emerald-500" : "bg-slate-200",
                )}
              />
            ))}
          </div>

          <div className="mt-6 min-h-[18rem]">
            {step === "choose" ? (
              <ChooseStep
                mode={mode}
                setMode={(nextMode) => {
                  setMode(nextMode);
                  setChargeAcknowledged(false);
                }}
                existingPhone={location.existingPhone}
              />
            ) : null}
            {step === "confirm" ? (
              <ConfirmStep
                hosted={hosted}
                mode={mode}
                location={location}
                eligibility={eligibility}
                checking={checking}
                checkExisting={checkExisting}
                areaCode={areaCode}
                setAreaCode={(nextAreaCode) => {
                  setAreaCode(nextAreaCode);
                  setNumbers([]);
                  setHasSearched(false);
                  setSelectedNumber(null);
                  setChargeAcknowledged(false);
                }}
                numbers={numbers}
                hasSearched={hasSearched}
                selectedNumber={selectedNumber}
                setSelectedNumber={(number) => {
                  setSelectedNumber(number);
                  setChargeAcknowledged(false);
                }}
                searchNumbers={searchNumbers}
              />
            ) : null}
            {step === "registration" ? (
              <RegistrationStep
                hosted={hosted}
                mode={mode}
                location={location}
                selectedNumber={selectedNumber}
                chargeAcknowledged={chargeAcknowledged}
                setChargeAcknowledged={setChargeAcknowledged}
              />
            ) : null}
            {step === "done" ? (
              <DoneStep sender={provisionedSender} hosted={hosted} />
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === "choose" || provision.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />{tx("Back")}</Button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{tx("Step")}{" "}{currentIndex + 1}{" "}{tx("of")}{" "}{STEPS.length}
              </span>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || checking || provision.isPending}
              >
                {checking || provision.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {continueLabel({ step, mode, eligibility, numbers })}
                {step !== "done" && !checking && !provision.isPending ? (
                  <ArrowRight className="ml-2 h-4 w-4" />
                ) : null}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChooseStep({
  mode,
  setMode,
  existingPhone,
}: {
  mode: MessagingSetupMode;
  setMode: (mode: MessagingSetupMode) => void;
  existingPhone: string | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-600">{tx("OpenVPM currently sets up a new local number for texting. Your clinic's existing voice line stays unchanged.")}</p>
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <p className="font-medium text-slate-950">{tx("Existing-number texting is not available yet")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {existingPhone
                ? `${existingPhone} will not be ported, hosted, or changed.`
                : tx("Your clinic phone line will not be ported, hosted, or changed.")}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMode("buy")}
        className={cn(
          "w-full rounded-xl border p-4 text-left transition-colors",
          mode === "buy"
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-200 hover:border-emerald-300",
        )}
      >
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-slate-950">{tx("Get a new local texting number")}</p>
            <p className="mt-1 text-sm text-slate-600">{tx("Choose a local number for outbound texts and client replies.")}</p>
          </div>
        </div>
      </button>
    </div>
  );
}

function ConfirmStep({
  hosted,
  mode,
  location,
  eligibility,
  checking,
  checkExisting,
  areaCode,
  setAreaCode,
  numbers,
  hasSearched,
  selectedNumber,
  setSelectedNumber,
  searchNumbers,
}: {
  hosted: boolean;
  mode: MessagingSetupMode;
  location: MessagingSetupLocation;
  eligibility: { eligible: boolean; detail?: string } | null;
  checking: boolean;
  checkExisting: () => void;
  areaCode: string;
  setAreaCode: (areaCode: string) => void;
  numbers: SearchNumber[];
  hasSearched: boolean;
  selectedNumber: SearchNumber | null;
  setSelectedNumber: (number: SearchNumber) => void;
  searchNumbers: () => void;
}) {
  if (mode === "host") {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">{tx("We will check whether")}{" "}{location.existingPhone ?? tx("this number")}{" "}{tx("can be text-enabled without porting voice service.")}</p>
        {eligibility === null ? (
          <Button variant="outline" onClick={checkExisting} disabled={checking}>
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}{tx("Check eligibility")}</Button>
        ) : eligibility.eligible ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <Check className="h-4 w-4" />{tx("Eligible to text-enable")}</p>
            <p className="mt-2 text-sm text-emerald-700">{tx("Continue to review the carrier registration step.")}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">{tx("This number is not eligible yet.")}</p>
            <p className="mt-2 text-sm text-amber-800">
              {eligibility.detail ??
                tx("Choose a new local number instead, or update the location phone.")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-600">{tx("Search for a local number. The selected number will be assigned to this location. Carrier registration remains not started until you complete the clinic details and")}{" "}
        {hosted
          ? tx("OpenVPM reviews them.")
          : tx("your administrator finishes provider activation.")}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">{tx("Area code")}</span>
          <Input
            value={areaCode}
            onChange={(e) =>
              setAreaCode(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, MESSAGING_AREA_CODE_LENGTH),
              )
            }
            maxLength={MESSAGING_AREA_CODE_LENGTH}
            inputMode="numeric"
            pattern={`\\d{${MESSAGING_AREA_CODE_LENGTH}}`}
            placeholder="415"
            className="w-28 border-slate-300"
          />
        </label>
        <Button
          variant="outline"
          onClick={searchNumbers}
          disabled={checking || !isMessagingAreaCodeInputValid(areaCode)}
        >
          {checking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}{tx("Search numbers")}</Button>
      </div>
      {numbers.length > 0 ? (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
          {numbers.map((n) => (
            <button
              type="button"
              key={n.phoneNumber}
              onClick={() => setSelectedNumber(n)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                selectedNumber?.phoneNumber === n.phoneNumber
                  ? "bg-emerald-50"
                  : "hover:bg-slate-50",
              )}
            >
              <span className="font-medium text-slate-950">
                {n.phoneNumber}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {formatCost(n.upfrontCost, n.currency)}{" "}{tx("today ·")}{" "}
                  {formatCost(n.monthlyCost, n.currency)}/mo
                </span>
                {selectedNumber?.phoneNumber === n.phoneNumber ? (
                  <Badge variant="success">{tx("Selected")}</Badge>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{tx("No available numbers returned a complete upfront price, monthly price, and currency. Nothing can be selected or purchased; search again later.")}</div>
      ) : null}
    </div>
  );
}

function RegistrationStep({
  hosted,
  mode,
  location,
  selectedNumber,
  chargeAcknowledged,
  setChargeAcknowledged,
}: {
  hosted: boolean;
  mode: MessagingSetupMode;
  location: MessagingSetupLocation;
  selectedNumber: SearchNumber | null;
  chargeAcknowledged: boolean;
  setChargeAcknowledged: (checked: boolean) => void;
}) {
  const number =
    mode === "host"
      ? (location.existingPhone ?? "your number")
      : selectedNumber?.phoneNumber;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-950">
          {setupModeTitle(mode)}
        </p>
        <p className="mt-1 text-sm text-slate-600">{number}</p>
      </div>
      {mode === "buy" && selectedNumber ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-950">{tx("Provider charges")}</p>
          <p className="mt-2 text-sm text-amber-900">
            {formatCost(selectedNumber.upfrontCost, selectedNumber.currency)}{" "}{tx("due now, then")}{" "}
            {formatCost(selectedNumber.monthlyCost, selectedNumber.currency)}
            /month for the number.
          </p>
        </div>
      ) : null}
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-sm font-medium text-teal-950">{tx("Carrier approval is required before live US texting.")}</p>
        <p className="mt-2 text-sm leading-6 text-teal-800">
          {hosted
            ? tx("The selected number will be saved with sending off. After this step, complete the clinic's legal and consent details in Messaging settings; OpenVPM reviews them before any fee-bearing carrier submission.")
            : tx("The selected number will be saved with sending off. After this step, complete the clinic's legal and consent details in Messaging settings; your administrator must finish carrier activation before sending.")}
        </p>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <input
          type="checkbox"
          checked={chargeAcknowledged}
          onChange={(event) => setChargeAcknowledged(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-amber-400"
        />
        <span>{tx("I authorize the exact upfront and monthly provider charges shown above for this selected number. Texting stays off until carrier approval is active and an administrator enables sending.")}</span>
      </label>
    </div>
  );
}

function DoneStep({
  sender,
  hosted,
}: {
  sender: string | null;
  hosted: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <Check className="h-4 w-4" />{tx("Number order accepted; sending remains off")}</p>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          {sender ?? tx("Your number")}{" "}{tx("is saved while the provider finishes any activation work. Carrier registration has not been submitted yet, and SMS sending stays off until approval is active and an admin turns it on.")}</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-950">{tx("Next: carrier approval")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {hosted
            ? tx("Complete the US carrier registration form in Messaging settings. OpenVPM will review and submit it. Hosted sending remains off until the clinic and one location are explicitly approved for the pilot; after approval, validate through a current consented client workflow.")
            : tx("Complete the US carrier registration form in Messaging settings. Your administrator must finish provider activation before enabling sending; after approval, validate through a current consented client workflow.")}
        </p>
      </div>
    </div>
  );
}

function continueLabel({
  step,
  mode,
  eligibility,
  numbers,
}: {
  step: Step;
  mode: MessagingSetupMode;
  eligibility: { eligible: boolean; detail?: string } | null;
  numbers: SearchNumber[];
}) {
  if (step === "choose") return "Continue";
  if (step === "confirm" && mode === "host" && eligibility === null) {
    return "Check eligibility";
  }
  if (step === "confirm" && mode === "buy" && numbers.length === 0) {
    return "Search numbers";
  }
  if (step === "registration") return "Purchase number and start setup";
  if (step === "done") return "Done";
  return "Continue";
}
