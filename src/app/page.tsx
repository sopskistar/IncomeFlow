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
              From requesting payment to organizing your income, track supported
              crypto payments and automatically set aside money with rules you
              control.
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
              The work is finished.
              <br />
              The financial admin isn’t.
            </h2>
            <p>
              Imagine a freelance designer delivering a website. There is still
              a payment to request, a balance to track, and income to organize.
              Payment Passport connects those steps. This is an illustrative
              scenario, not a customer story.
            </p>
            <Link className="text-link" href="/help">
              Understand the payment flow
            </Link>
          </div>
          <ol className="story-steps">
            <li>
              <span>Set your destinations</span>
              <p>
                Create an owner-signed request for your job, then choose your
                allocation wallets and percentages.
              </p>
            </li>
            <li>
              <span>Share your payment request</span>
              <p>
                Clients verify your receiving vault and send test ifUSD.
                Explicitly associate the transaction and log index; partial
                payments remain visible.
              </p>
            </li>
            <li>
              <span>Keep the financial record</span>
              <p>
                Reactive observes the payment and triggers your vault. Keep
                verified transfers and allocation evidence alongside the
                request.
              </p>
            </li>
          </ol>
        </section>
        <section className="container problem-evidence">
          <h2>Getting paid is not the end of the admin.</h2>
          <p>
            QuickBooks’ 2026 report says 59% of surveyed small businesses had
            invoices overdue by 30 days or more.{" "}
            <a
              className="text-link"
              href="https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/"
            >
              Read the original report
            </a>
            .
          </p>
          <p className="small muted">
            This research covers small businesses broadly, not crypto
            freelancers. It establishes the wider problem, not IncomeFlow’s
            effectiveness. IncomeFlow cannot make a client pay sooner.
          </p>
          <Link className="button secondary" href="/passport">
            Create a payment request
          </Link>
          <Link className="text-link" href="/passport-demo">
            Explore a verified Payment Passport
          </Link>
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
