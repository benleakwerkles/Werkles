import Link from "next/link";

import { MEMBER_DATA_CUSTODY } from "@/lib/member-data-custody";

export function MemberDataCustodyMap() {
  return (
    <section className="ops-card member-data-custody" aria-labelledby="member-data-custody-title">
      <div className="card-heading">
        <p>Before you enter personal information</p>
        <h2 id="member-data-custody-title">What saves where — and what does not</h2>
      </div>
      <p className="member-data-custody__lead">
        These records do different jobs. A saved answer, a signed-in account, and a completed check are not the same
        thing.
      </p>
      <ul className="member-data-custody__list">
        {MEMBER_DATA_CUSTODY.map((entry) => (
          <li key={entry.id} data-custody-state={entry.state}>
            <div className="member-data-custody__heading">
              <h3>{entry.title}</h3>
              <span>{entry.stateLabel}</span>
            </div>
            <p>{entry.storedWhere}</p>
            <p className="member-data-custody__boundary">
              <strong>Does not mean:</strong> {entry.boundary}
            </p>
            <Link href={entry.href}>{entry.linkLabel}</Link>
          </li>
        ))}
      </ul>
      <p className="member-data-custody__note" role="note">
        Production providers are off. Do not enter information here that you expect to follow your account until the
        page says the account save succeeded.
      </p>
    </section>
  );
}

