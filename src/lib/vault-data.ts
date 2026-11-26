export type Allocation = {
  recipient: string;
  amount: string;
  ruleIndex: number;
};
export type Payment = {
  id: string;
  originHash: string;
  logIndex: number;
  block: string;
  amount: string;
  payer: string;
  status:
    | "Payment detected"
    | "Callback requested"
    | "Distribution confirmed"
    | "Recovered"
    | "Awaiting funding"
    | "Failed"
    | "Recovery required";
  reactiveHash?: string;
  destinationHash?: string;
  version?: string;
  allocations: Allocation[];
  failure?: string;
};
export type VaultData = {
  address: string;
  owner: string;
  reactive: string;
  token: string;
  paused: boolean;
  policyVersion: string;
  recoveryBlock: string;
  balance: string;
  totalDistributed: string;
  paymentCount: string;
  rules: { recipient: string; bps: number; label: string }[];
  health: {
    vaultBalance: string;
    vaultDebt: string;
    vaultReserves: string;
    reactiveBalance?: string;
    reactiveDebt?: string;
    reactiveReserves?: string;
    subscribed?: boolean;
    error?: string;
  };
  payments: Payment[];
  history: {
    from: string;
    to: string;
    nextBefore: string | null;
    partial: boolean;
  };
  checkedAt: string;
};
