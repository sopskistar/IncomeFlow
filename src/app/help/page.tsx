import Link from "next/link";
import { Header, Footer, ChainLink } from "@/components/shared";
import { demoVault, demoReactive, proxy, system } from "@/lib/contracts";
export const metadata = { title: "Help and testnet funding" };
export default function Help() {
  return (
    <>
      <Header />
      <main className="container help-page" id="main">
        <h1>
          A little guidance.
          <br />A lot more clarity.
        </h1>
        <p className="lead">
          IncomeFlow organizes supported payments using rules you set. Here’s
          how to get started and stay in control.
        </p>
        <section>
          <h2>Start with your own vault</h2>
          <ol>
            <li>Connect an EVM wallet such as Rabby or MetaMask.</li>
            <li>Fund it with Base Sepolia test ETH and Lasna lREACT.</li>
            <li>
              Open the workspace and create a vault. Confirm the automation
              deployment, receiving vault deployment and subscription
              registration across the two testnets.
            </li>
            <li>
              Set distinct spending, savings and reserve addresses. Percentages
              must total exactly 100%.
            </li>
            <li>
              Claim demo ifUSD in Receive, send it to the receiving address, and
              follow its actual receipt in Activity.
            </li>
          </ol>
          <Link className="button primary" href="/app">
            Open your workspace
          </Link>
        </section>
        <section id="funding">
          <h2>Get testnet funds</h2>
          <p>
            This demonstration uses valueless testnet assets. Never send mainnet
            funds or official USDC to an IncomeFlow demo address.
          </p>
          <dl className="key-values">
            <dt>Base Sepolia</dt>
            <dd>
              Chain 84532. RPC https://sepolia.base.org. Gas token: test ETH.{" "}
              <a
                href="https://docs.base.org/base-chain/tools/network-faucets"
                target="_blank"
                rel="noopener noreferrer"
              >
                Base faucet guide
              </a>
              . Provider requirements vary; use a source you can access or
              transfer test ETH from an existing test wallet.
            </dd>
            <dt>Reactive Lasna</dt>
            <dd>
              Chain 5318007. RPC https://lasna-rpc.rnk.dev/. Gas token: lREACT.{" "}
              <a
                href="https://dev.reactive.network/reactive-mainnet"
                target="_blank"
                rel="noopener noreferrer"
              >
                Official funding instructions
              </a>
              .
            </dd>
          </dl>
          <p>
            The documented Base Sepolia faucet{" "}
            <ChainLink
              kind="address"
              value="0x2afaFD298b23b62760711756088F75B7409f5967"
            />{" "}
            supports payable <code>request(address)</code>. The documented rate
            is 1 test ETH to 100 lREACT; 0.02 test ETH requested 2 lREACT in our
            verified run. Check the resulting Lasna balance before paying again.
          </p>
          <p>
            Vault setup deposits 0.5 lREACT for reactions and 0.003 Base test
            ETH for callbacks, plus transaction/deployment gas. These are
            starting fee balances, not guaranteed operating lifetimes.
          </p>
        </section>
        <section>
          <h2>What happens after a payment?</h2>
          <p>
            An ordinary ERC-20 transfer does not call the receiving vault.
            Reactive watches the token’s Transfer event, validates the
            destination, and asks the Base callback service to execute the
            vault. The vault checks both the official proxy and your specific
            automation contract before paying recipients.
          </p>
          <p>
            There is no backend payout wallet or cron job. The automation
            depends on network ingestion, callback delivery, correct rules and
            funded services. A deposit is not a completed allocation until its
            destination receipt and token payouts are observed.
          </p>
          <Link className="text-link" href="/proof">
            Inspect the complete verified loop
          </Link>
        </section>
        <section>
          <h2>Common questions</h2>
          <details>
            <summary>My payment arrived but has not been allocated.</summary>
            <p>
              Refresh Activity and inspect Health. Check rules are configured,
              allocations are not paused, the subscription is active, and both
              services have funds and no debt. If a previously requested
              callback failed, top up as needed and retry its recorded payment
              ID after the cooldown. Subscription resume does not guarantee
              replay of missed origin events.
            </p>
          </details>
          <details>
            <summary>How do fees and debt work?</summary>
            <p>
              Lasna reactions cost lREACT; Base callbacks cost test ETH. In
              Health, top-ups call the official service’s depositTo(vault or
              RC), settling debt before adding reserves. Direct native transfers
              alone do not necessarily settle existing debt. Failed callbacks
              also cost fees.
            </p>
          </details>
          <details>
            <summary>Can I change my plan after receiving a payment?</summary>
            <p>
              Yes. The current policy at callback execution applies, including
              to pending payments. Each completed receipt includes its executed
              version. Later rule changes do not alter completed payouts.
            </p>
          </details>
          <details>
            <summary>Can I recover my money?</summary>
            <p>
              The owner can pause the vault and recover its entire remaining
              supported-token balance. Recovery invalidates pending callbacks
              for deposits through the recovery block so they cannot spend new
              income. Deposits in that same block are also excluded and remain
              recoverable. Never share your seed phrase.
            </p>
          </details>
          <details>
            <summary>Is the tax reserve a tax calculation?</summary>
            <p>
              No. It is a percentage you choose for a destination wallet.
              IncomeFlow does not determine tax liability or replace accounting
              or tax services.
            </p>
          </details>
          <details>
            <summary>Which tokens are supported?</summary>
            <p>
              Only the deployed six-decimal IncomeFlow Demo USD (ifUSD) on Base
              Sepolia. It is not official USDC, has no monetary value and cannot
              be redeemed. Fee-on-transfer, rebasing and arbitrary tokens are
              unsupported.
            </p>
          </details>
          <details>
            <summary>What if the RPC is unavailable?</summary>
            <p>
              The app shows a synchronization error instead of inventing a
              balance. The core automation runs independently of the app. Follow
              explorer receipts and use the repository diagnostics. Activity
              reads recent blocks in 200-block pages; load older history when
              needed.
            </p>
          </details>
        </section>
        <section>
          <h2>Demo contracts</h2>
          <p>
            These are the verified demonstration pair, not a shared custodial
            account for users.
          </p>
          <p>
            <ChainLink value={demoVault} kind="address">
              Base Sepolia demo vault
            </ChainLink>
          </p>
          <p>
            <ChainLink value={demoReactive} kind="address" chain={5318007}>
              Lasna demo automation
            </ChainLink>
          </p>
          <p>
            <ChainLink value={proxy} kind="address">
              Official Base callback proxy
            </ChainLink>
          </p>
          <p>
            <ChainLink value={system} kind="address" chain={5318007}>
              Reactive system
            </ChainLink>
          </p>
        </section>
        <p className="notice">
          Internal security review and automated tests are not an independent
          audit. This build is for testnets. An independent audit would be
          necessary before mainnet use.
        </p>
      </main>
      <Footer />
    </>
  );
}
