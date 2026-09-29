import { notFound } from "next/navigation";
import { getPublicMessagingProgram } from "@/lib/messaging/public-program";
import { tx } from "@/lib/i18n";

export default async function SmsTermsPage({
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
      <h1>{tx("SMS terms and conditions")}</h1>
      <p>{tx("Last updated: August 8, 2026")}</p>

      <h2>{tx("Program")}</h2>
      <p>{tx("By opting in, you authorize")}{" "}{program.displayName}{" "}{tx("to send veterinary service text messages to the mobile number you provide. Messages may include appointment reminders, vaccination and care updates, prescription or follow-up notices, and two-way client support. OpenVPM supplies the clinic's messaging technology.")}</p>

      <h2>{tx("Consent and frequency")}</h2>
      <p>{tx("Your consent is optional and is not a condition of purchasing goods or services. Message frequency varies based on your pets' care and your interactions with the clinic. Message and data rates may apply.")}</p>

      <h2>{tx("Opt out and help")}</h2>
      <ul>
        <li>{tx("Reply STOP to cancel text messages.")}</li>
        <li>{tx("Reply HELP for help.")}</li>
        <li>{tx("After opting out, you may receive one confirmation message. You can later reply START or give the clinic new consent to resume messages.")}</li>
      </ul>

      <h2>{tx("Delivery")}</h2>
      <p>{tx("Carriers are not liable for delayed or undelivered messages. Texting is not appropriate for emergencies. Contact an emergency veterinary provider directly when urgent care is needed.")}</p>

      <h2>{tx("Privacy and contact")}</h2>
      <p>{tx("The clinic's SMS privacy policy explains how messaging information is handled. For program help,")}{" "}
        {program.businessPhone ? (
          <>{tx("call")}{" "}{program.businessPhone}.</>
        ) : program.website ? (
          <>{tx("visit the clinic's")}{" "}<a href={program.website}>{tx("website")}</a>.
          </>
        ) : (
          <>{tx("contact")}{" "}{program.displayName} directly.</>
        )}
      </p>
    </>
  );
}
