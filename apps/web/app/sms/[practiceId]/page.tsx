import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicMessagingProgram } from "@/lib/messaging/public-program";
import { tx } from "@/lib/i18n";

export default async function SmsProgramPage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const program = await getPublicMessagingProgram(practiceId);
  if (!program) notFound();
  const root = "/sms/" + encodeURIComponent(program.practiceId);

  return (
    <>
      <p className="font-medium text-primary">{tx("Clinic text messaging")}</p>
      <h1>{program.displayName}</h1>
      <p>
        {program.displayName}{" "}{tx("may use OpenVPM to send requested veterinary service messages. These may include appointment reminders, vaccination and care updates, and replies to client questions.")}</p>

      <h2>{tx("Your choice")}</h2>
      <p>{tx("Text messaging is optional. The clinic records consent before sending messages. Message frequency varies, and message and data rates may apply. Consent is not a condition of purchasing veterinary services.")}</p>

      <h2>{tx("Manage messages")}</h2>
      <ul>
        <li>{tx("Reply STOP at any time to stop text messages.")}</li>
        <li>{tx("Reply HELP for help with the messaging program.")}</li>
        <li>{tx("You may opt back in later by replying START or giving the clinic new permission.")}</li>
      </ul>

      <h2>{tx("Program details")}</h2>
      <ul>
        <li>
          <Link href={root + "/opt-in"}>{tx("How consent is collected")}</Link>
        </li>
        <li>
          <Link href={root + "/privacy"}>{tx("SMS privacy policy")}</Link>
        </li>
        <li>
          <Link href={root + "/terms"}>{tx("SMS terms and conditions")}</Link>
        </li>
      </ul>

      <h2>{tx("Contact the clinic")}</h2>
      <p>
        {program.businessPhone ? (
          <>{tx("Call")}{" "}{program.businessPhone}{" "}{tx("for help.")}</>
        ) : program.website ? (
          <>{tx("Visit the clinic's")}{" "}<a href={program.website}>{tx("website")}</a>{" "}{tx("for contact information.")}</>
        ) : (
          <>{tx("Contact the clinic directly for help.")}</>
        )}
      </p>

      <p>{tx("Last updated: August 8, 2026")}</p>
    </>
  );
}
