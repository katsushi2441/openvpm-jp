import { tx } from "@/lib/i18n";
interface SoapNoteDisplayProps {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export function SoapNoteDisplay({
  subjective,
  objective,
  assessment,
  plan,
}: SoapNoteDisplayProps) {
  return (
    <div className="space-y-6">
      {subjective && (
        <div>
          <h4 className="font-semibold text-sm mb-2">{tx("Subjective")}</h4>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: subjective }}
          />
        </div>
      )}

      {objective && (
        <div>
          <h4 className="font-semibold text-sm mb-2">{tx("Objective")}</h4>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: objective }}
          />
        </div>
      )}

      {assessment && (
        <div>
          <h4 className="font-semibold text-sm mb-2">{tx("Assessment")}</h4>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: assessment }}
          />
        </div>
      )}

      {plan && (
        <div>
          <h4 className="font-semibold text-sm mb-2">{tx("Plan")}</h4>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: plan }}
          />
        </div>
      )}
    </div>
  );
}
