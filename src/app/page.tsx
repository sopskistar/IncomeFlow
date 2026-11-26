import Link from "next/link";
import { ArrowUpRight, Check, GitBranch, LockKeyhole } from "lucide-react";
import { Header, Footer } from "@/components/shared";
import { AllocationPreview } from "@/components/allocation-preview";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="container landing-hero">
          <div className="hero-copy">
            <h1>
              Give every payment
              <br />a purpose.
            </h1>
            <p>
              Get paid in crypto. Automatically set aside what you need for
              spending, savings and taxes, with rules you control.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/app">
                Organize your income
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link className="text-link" href="/app?vault=demo">
                Explore the verified vault
              </Link>
            </div>
            <p className="hero-note">
              Built for independent professionals. Currently on testnets.
            </p>
          </div>
          <AllocationPreview />
        </section>
        <section className="proof-ribbon">
          <div className="container ribbon-inner">
            <span>
              <Check size={18} aria-hidden="true" />
              Real payment. Real automatic allocations.
            </span>
            <p>100 ifUSD received. 50 / 30 / 20 distributed.</p>
            <Link href="/proof">
              Inspect the on-chain receipt
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="container story-section">
          <div>
            <h2>
              Your work is done.
              <br />
              Let your income get organized.
            </h2>
            <p>
              A client pays your vault like any other wallet. IncomeFlow handles
              the repetitive part, even when you’re offline.
            </p>
            <Link className="text-link" href="/help">
              Understand the payment flow
            </Link>
          </div>
          <ol className="story-steps">
            <li>
              <span>Set your destinations</span>
              <p>
                Choose your wallets and percentages. Confirm your rules once.
              </p>
            </li>
            <li>
              <span>Share your vault address</span>
              <p>
                Receive the supported token through a regular ERC-20 transfer.
              </p>
            </li>
            <li>
              <span>Follow the allocation</span>
              <p>
                Reactive observes the payment and triggers your vault. Every
                payout has a public receipt.
              </p>
            </li>
          </ol>
        </section>
        <section className="control-section">
          <div className="container control-grid">
            <div>
              <LockKeyhole size={26} aria-hidden="true" />
              <h2>
                Your vault.
                <br />
                Your rules.
              </h2>
              <p>
                Only your wallet can change destinations, pause allocations or
                recover funds. No server holds a payout key.
              </p>
            </div>
            <div>
              <GitBranch size={26} aria-hidden="true" />
              <h2>
                Automation you
                <br />
                can inspect.
              </h2>
              <p>
                Follow the original transfer, Reactive execution and
                authenticated callback. The evidence is public and the code is
                open.
              </p>
              <Link className="text-link" href="/proof">
                See the verified payment
              </Link>
            </div>
          </div>
        </section>
        <section className="container closing">
          <h2>
            One setup.
            <br />A little less financial admin.
          </h2>
          <Link className="button primary" href="/app">
            Open your workspace
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <p className="small muted">
            ifUSD is a valueless demo token. A tax reserve is your chosen
            allocation, not a calculation of tax owed.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
