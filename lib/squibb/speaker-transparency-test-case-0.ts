/**

 * Speaker human read — Test Case #0

 * Transparency for comprehension, not a black box.

 */



import type { ConfidenceLabel } from "@/lib/squibb/walkthrough-types";



export type SpeakerAlternative = {

  id: string;

  title: string;

  plainEnglish: string;

  wouldMean: string;

};



export type SpeakerHumanRead = {

  version: "user-0";

  testCaseId: "0";

  speakersRead: {

    headline: string;

    summary: string;

  };

  whySpeakerThinksThis: {

    reasons: string[];

  };

  alternativeHypotheses: SpeakerAlternative[];

  wouldProveWrong: string[];

  confidence: {

    score: number;

    label: ConfidenceLabel;

    why: string;

  };

};



export const SPEAKER_HUMAN_READ_TEST_CASE_0: SpeakerHumanRead = {

  version: "user-0",

  testCaseId: "0",

  speakersRead: {

    headline: "Partner might be the wrong word",

    summary: "The real gap isn't confirmed yet. Speaker isn't saying you're wrong — just that the need isn't named."

  },

  whySpeakerThinksThis: {

    reasons: [

      "No first-week job description for the partner.",

      "Runway and role split are still unknown.",

      "That pattern usually means the gap isn't named yet."

    ]

  },

  alternativeHypotheses: [

    {

      id: "alt-capital",

      title: "Money",

      plainEnglish: "Loan or investor — not a co-owner.",

      wouldMean: ""

    },

    {

      id: "alt-ops",

      title: "Help running the work",

      plainEnglish: "Hire or contract — not equity.",

      wouldMean: ""

    },

    {

      id: "alt-clarity",

      title: "Clarity first",

      plainEnglish: "\"Partner\" can be a comfort word when the path is fuzzy.",

      wouldMean: ""

    }

  ],

  wouldProveWrong: [

    "You write a week-one job description and it still feels right.",

    "You need labor or skill — not capital — and a hiring plan is clear.",

    "Your test names the problem without leaning on \"partner.\""

  ],

  confidence: {

    score: 32,

    label: "low",

    why: "Sure about how you framed it — not about what you actually need. The test changes that."

  }

};



/** @deprecated Use loadSpeakerHumanReadTestCase0 */

export type SpeakerTransparency = SpeakerHumanRead;



export function loadSpeakerHumanReadTestCase0(): SpeakerHumanRead {

  return SPEAKER_HUMAN_READ_TEST_CASE_0;

}



export function loadSpeakerTransparencyTestCase0(): SpeakerHumanRead {

  return loadSpeakerHumanReadTestCase0();

}


