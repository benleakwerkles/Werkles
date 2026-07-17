/**
 * Public Bellows intake stays closed until submissions have durable,
 * owner-scoped custody. Keep the route and the form on this shared boundary.
 */
export const BELLOWS_INTAKE_SUBMISSION_OPEN = false;

export const BELLOWS_INTAKE_CLOSED_MESSAGE =
  "Intake submission is temporarily closed while secure account storage is being connected.";
