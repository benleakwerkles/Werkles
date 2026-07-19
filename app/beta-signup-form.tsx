import Link from "next/link";

export default function BetaSignupDoorway() {
  return (
    <div className="beta-form" aria-label="Public testing doorway">
      <p className="status-line">
        Public testing is open. This page does not collect your email; account details are handled through the
        account doorway.
      </p>
      <div className="member-selected-surface__actions">
        <Link className="button button-dark" href="/signup?next=%2Fbellows%2Frecommendations">
          Create a free account
        </Link>
        <Link className="button button-outline" href="/bellows/recommendations">
          See the recommendation example
        </Link>
      </div>
    </div>
  );
}
