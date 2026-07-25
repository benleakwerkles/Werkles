import { copy } from "@/lib/copy";

export function HomeValueFold() {
  const { valueFold } = copy.home;

  return (
    <section className="home-value-fold" aria-label="What Werkles is">
      <article className="home-value-fold__card">
        <h2>{valueFold.what.label}</h2>
        <p>{valueFold.what.body}</p>
      </article>
      <article className="home-value-fold__card home-value-fold__card--need">
        <h2>{valueFold.whyNeed.label}</h2>
        <p>{valueFold.whyNeed.body}</p>
      </article>
      <article className="home-value-fold__card home-value-fold__card--pay">
        <h2>{valueFold.whyPay.label}</h2>
        <p>{valueFold.whyPay.body}</p>
      </article>
    </section>
  );
}
