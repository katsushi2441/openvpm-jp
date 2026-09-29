import { notFound } from "next/navigation";
import { getPublicMessagingProgram } from "@/lib/messaging/public-program";
import { tx } from "@/lib/i18n";

export default async function SmsPrivacyPage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const program = await getPublicMessagingProgram(practiceId);
  if (!program) notFound();

  return (
    <>
      <p className="font-medium text-primary">{program.displayName}</p>
      <h1>{tx("SMS privacy policy")}</h1>
      <p>{tx("Last updated: August 8, 2026")}</p>

      <p>{tx("This policy applies to text messages sent by")}{" "}{program.displayName}{" "}{tx("through OpenVPM. The clinic controls its client information; OpenVPM processes that information to provide the messaging service.")}</p>

      <h2>{tx("Information used for texting")}</h2>
      <p>{tx("The clinic may use your name, mobile number, pet and appointment details, message content, consent record, and opt-out status to send requested veterinary service messages and respond to you.")}</p>

      <h2>{tx("How information is used")}</h2>
      <ul>
        <li>{tx("Send appointment reminders and schedule updates.")}</li>
        <li>{tx("Send vaccination, care, prescription, and follow-up notices.")}</li>
        <li>{tx("Answer client questions and record messaging preferences.")}</li>
        <li>{tx("Secure, troubleshoot, and document the messaging service.")}</li>
      </ul>

      <h2>{tx("No sale or promotional sharing")}</h2>
      <p>{tx("The clinic and OpenVPM do not sell your personal information. SMS opt-in data and consent are not shared with third parties for their own marketing or promotional purposes.")}</p>
      <p>{tx("Information may be processed by OpenVPM's infrastructure providers, telecommunications carriers, and other service providers only as needed to deliver, secure, and support the clinic's messages or meet legal obligations.")}</p>

      <h2>{tx("Retention and security")}</h2>
      <p>{tx("Consent, message, and opt-out records are retained as part of the clinic's business and medical-record systems for as long as needed to provide the service and meet legal or operational requirements. OpenVPM uses encryption in transit, role-based access, and tenant isolation to protect hosted records.")}</p>

      <h2>{tx("Your choices")}</h2>
      <p>{tx("Reply STOP to stop text messages or HELP for help. You may also contact the clinic to ask about its records or update your communication preferences. An opt-out applies to text messages; the clinic may still contact you through other channels when appropriate.")}</p>

      <h2>{tx("Contact")}</h2>
      <p>
        {program.businessPhone ? (
          <>{tx("Call")}{" "}{program.businessPhone}{" "}{tx("with privacy or messaging questions.")}</>
        ) : program.website ? (
          <>{tx("Visit the clinic's")}{" "}<a href={program.website}>{tx("website")}</a>{" "}{tx("for contact information.")}</>
        ) : (
          <>{tx("Contact")}{" "}{program.displayName}{" "}{tx("directly with questions.")}</>
        )}
      </p>
    </>
  );
}
