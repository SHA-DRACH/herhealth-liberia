export const metadata = { title: "Privacy notice — HerHealth Liberia" };

const contact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT;

/**
 * Describes what the software actually does. Keep in sync with PRIVACY.md and the code.
 * This notice is in English only until a reviewed translation exists.
 */
export default function PrivacyPage() {
  return (
    <article className="prose-hh space-y-5">
      <h1 className="text-2xl font-bold text-plum-900">Privacy notice</h1>
      <p>
        HerHealth Liberia is an educational health information service developed by SkillBridge Liberia Corporation. This prototype is
        being tested before a wider launch.
      </p>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">What you do not need to give us</h2>
        <p>You never need to give your name, phone number, email, date of birth or national ID to use HerHealth. There is no sign-up.</p>
      </section>

      <section id="data" className="card space-y-2 p-5">
        <h2 className="font-bold">How HerHealth uses data</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your phone keeps a random ID (for example 13cb2c94-…). It is not linked to your name or number.</li>
          <li>We count anonymous events such as &ldquo;an article was opened&rdquo; or &ldquo;audio was played&rdquo; to learn whether HerHealth is useful.</li>
          <li>
            <strong>We do not save the text of questions you ask.</strong> We keep only the topic, the safety level and a scrambled code that cannot be
            turned back into your words.
          </li>
          <li>We do not store your IP address. We use no advertising trackers, no Meta Pixel and no third-party analytics.</li>
          <li>If you write a comment, please leave out names and phone numbers. We remove phone numbers and emails automatically.</li>
          <li>Public reports show only totals, never individual activity or questions.</li>
        </ul>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">Clearing your activity</h2>
        <p>
          Menu → Privacy → <em>Clear this session</em> deletes the ID on your phone, deletes your comments from our server and unlinks your past activity
          from the ID. <em>Clear downloaded content</em> removes saved articles and audio from your phone.
        </p>
      </section>

      <section id="ai" className="card space-y-2 p-5">
        <h2 className="font-bold">AI limitations</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>HerHealth is not a doctor or nurse. It cannot examine you, diagnose a condition or prescribe medicine.</li>
          <li>Answers come only from articles checked by qualified health reviewers. If there is no reviewed information, HerHealth will say so.</li>
          <li>If your question sounds like an emergency, HerHealth will not answer normally. It will ask you to get urgent professional care.</li>
          <li>Always talk to a qualified health worker about your own health.</li>
        </ul>
      </section>

      {contact && (
        <p>
          Questions about privacy: <a className="underline" href={`mailto:${contact}`}>{contact}</a>
        </p>
      )}
    </article>
  );
}
