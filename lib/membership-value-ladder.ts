export const WERKLES_TERMS = Object.freeze({
  workshop: Object.freeze({
    term: "Workshop",
    definition: "Your private working room for one idea, decision, or business in progress."
  }),
  werkle: Object.freeze({
    term: "Werkle",
    definition: "Shared work created when two or more Werklers connect around the same idea or opportunity."
  })
});

export const WERKLES_VALUE_LADDER = Object.freeze([
  Object.freeze({
    id: "free",
    label: "Free Werkler",
    price: "$0",
    status: "Useful before you pay",
    features: Object.freeze([
      "Build a personal Workshop from your answers",
      "Receive practical next moves and the reasons behind them",
      "See people who may fit and compare what each person brings",
      "Preview what a shared Werkle could become"
    ])
  }),
  Object.freeze({
    id: "packet",
    label: "One focused packet",
    price: "Buy only what you need",
    status: "Individual Bellows tools",
    features: Object.freeze([
      "Choose a lesson, checklist, template, or starter kit",
      "Pay the posted non-member price once",
      "Keep the useful result without starting a subscription"
    ])
  }),
  Object.freeze({
    id: "member",
    label: "Werkles member",
    price: "$9.99 / month",
    status: "The ongoing working layer",
    features: Object.freeze([
      "Everything in the free product",
      "Bellows packets included instead of bought one by one",
      "Ongoing Workshop tools and tailored follow-through",
      "Member features inside every shared Werkle"
    ])
  }),
  Object.freeze({
    id: "shared",
    label: "Shared Werkle",
    price: "Best when everyone joins",
    status: "Two Workshops become shared work",
    features: Object.freeze([
      "A shared plan, decisions, files, and responsibilities",
      "Lessons and outside help chosen for the actual Werkle",
      "A free preview for both people before membership",
      "Member tools for paid participants while everyone keeps their own Workshop and free shared preview"
    ])
  })
]);

export const WERKLES_MEMBERSHIP_PROMISE =
  "The free product should solve something real. Membership should earn its price by saving more time, including more tools, and helping shared work keep moving—not by making free deliberately frustrating.";
