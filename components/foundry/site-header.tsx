import Link from "next/link";

import { BrandMark } from "@/components/foundry/brand-mark";

import { NavDocumentaryIcon } from "@/components/foundry/nav-documentary-icon";

import { copy } from "@/lib/copy";

import { primaryNavItems } from "@/lib/site-nav";



export function SiteHeader() {

  return (

    <header className="site-header site-header--nav-doc">

      <Link className="brand brand--tight" href="/" aria-label="Werkles home">

        <BrandMark size="header" presentation="board" />

        <span className="brand-word brand-word--workshop-serif">erkles</span>

      </Link>

      <nav aria-label="Primary navigation">

        {primaryNavItems.map((item) => (

          <Link key={item.id} href={item.href} className="site-nav-link" title={item.symbol}>

            <NavDocumentaryIcon item={item} />

            <span className="site-nav-link__label">{item.label}</span>

          </Link>

        ))}

      </nav>

      <div className="site-header__actions">

        <Link className="site-header__login" href="/login">

          {copy.nav.login}

        </Link>

        <Link className="header-cta" href="/signup">

          {copy.hero.primaryCta}

        </Link>

      </div>

    </header>

  );

}

