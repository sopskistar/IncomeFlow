"use client";
import Link from "next/link";
import { useState, useSyncExternalStore, useRef } from "react";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { Copy, Check, ExternalLink, Wallet, Moon, Sun } from "lucide-react";
import { explorer, shortAddress } from "@/lib/domain";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="IncomeFlow home">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M5 18h6c8 0 6-12 14-12h6M11 18h20M11 18c8 0 6 12 14 12h6" />
      </svg>
      <span>IncomeFlow</span>
    </Link>
  );
}
export function ChainLink({
  value,
  chain = 84532,
  kind = "tx",
  children,
}: {
  value: string;
  chain?: number;
  kind?: "tx" | "address";
  children?: React.ReactNode;
}) {
  return (
    <a
      className="chain-link"
      href={explorer(chain, value, kind)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children || shortAddress(value)}
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}
export function CopyButton({
  value,
  label = "Copy address",
}: {
  value: string;
  label?: string;
}) {
  const [state, setState] = useState("");
  return (
    <>
      <button
        className="button subtle compact"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setState("Copied");
            setTimeout(() => setState(""), 2500);
          } catch {
            setState("Copy unavailable. Select and copy the address.");
          }
        }}
      >
        {state === "Copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        {state === "Copied" ? "Copied" : label}
      </button>
      <span className="sr-only" role="status">
        {state}
      </span>
    </>
  );
}
export function ThemeButton() {
  const dark = useSyncExternalStore(
    (listener) => {
      window.addEventListener("incomeflow-theme", listener);
      return () => window.removeEventListener("incomeflow-theme", listener);
    },
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  return (
    <button
      className="icon-button"
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      onClick={() => {
        const next = !dark;
        document.documentElement.dataset.theme = next ? "dark" : "light";
        window.dispatchEvent(new Event("incomeflow-theme"));
      }}
    >
      {dark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
export function WalletControl() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const { address, chainId } = useConnection();
  const { connectAsync, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [notice, setNotice] = useState("");
  return (
    <div className="wallet-control">
      {address ? (
        <details className="wallet-menu" ref={menuRef}>
          <summary className="button secondary compact">
            <Wallet size={16} aria-hidden="true" />
            {shortAddress(address)}
          </summary>
          <div className="wallet-options">
            <p>
              {chainId === 84532
                ? "Base Sepolia"
                : chainId === 5318007
                  ? "Reactive Lasna"
                  : "Unsupported network"}
            </p>
            <button
              className="button secondary"
              onClick={() =>
                switchChainAsync({ chainId: 84532 })
                  .then(() => menuRef.current?.removeAttribute("open"))
                  .catch(() =>
                    setNotice(
                      "Network switch declined. Switch to Base Sepolia in your wallet.",
                    ),
                  )
              }
            >
              Switch to Base Sepolia
            </button>
            <button
              className="button subtle"
              onClick={() => {
                menuRef.current?.removeAttribute("open");
                disconnect();
              }}
            >
              Disconnect wallet
            </button>
            {notice && <p role="status">{notice}</p>}
          </div>
        </details>
      ) : (
        <details className="wallet-menu" ref={menuRef}>
          <summary
            className="button primary compact"
            aria-label="Connect wallet"
          >
            <Wallet size={16} aria-hidden="true" />
            <span className="wallet-full">Connect wallet</span>
            <span className="wallet-short" aria-hidden="true">
              Connect
            </span>
          </summary>
          <div className="wallet-options">
            <p>Use an EVM wallet such as Rabby or MetaMask. Testnets only.</p>
            {connectors.length ? (
              connectors.map((c) => (
                <button
                  className="button secondary"
                  key={c.uid}
                  disabled={isPending}
                  onClick={() =>
                    connectAsync({ connector: c })
                      .then(() => menuRef.current?.removeAttribute("open"))
                      .catch(() =>
                        setNotice(
                          "Wallet connection declined or unavailable. Open your wallet and try again.",
                        ),
                      )
                  }
                >
                  {isPending
                    ? "Connecting…"
                    : c.name === "Injected"
                      ? "Browser wallet"
                      : c.name}
                </button>
              ))
            ) : (
              <p>
                No wallet detected. Open this page in an EVM wallet browser or
                install a browser wallet.
              </p>
            )}
            {(error || notice) && (
              <p role="alert">
                {notice || "Connection failed. Check your browser wallet."}
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Main">
          <Link href="/app">Workspace</Link>
          <Link href="/proof">On-chain proof</Link>
          <Link href="/help">Help</Link>
        </nav>
        <div className="header-actions">
          <ThemeButton />
          <WalletControl />
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer container">
      <Brand />
      <p>Personal income. Purposefully allocated.</p>
      <a
        href="https://github.com/sopskistar/IncomeFlow"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open source on GitHub
      </a>
      <span>Testnet funds only</span>
    </footer>
  );
}
