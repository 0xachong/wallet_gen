export type ChainType = 'ETH' | 'BSC' | 'HECO' | 'MATIC' | 'FANTOM' | 'SOL' | 'TRX' | 'SUI' | 'APTOS' | 'BITCOIN' | 'BITCOIN_TESTNET' | 'COSMOS' | 'TON';
import { EthWallet } from '@okxweb3/coin-ethereum';
import { SolWallet } from '@okxweb3/coin-solana';
import { BtcWallet } from '@okxweb3/coin-bitcoin';
import { SuiWallet } from '@okxweb3/coin-sui';
import { AptosWallet } from '@okxweb3/coin-aptos';
export const WalletMap = {
    'ETH': EthWallet,
    'BSC': EthWallet,
    'MATIC': EthWallet,
    'FANTOM': EthWallet,
    'SOL': SolWallet,
    'BITCOIN': BtcWallet,
    // 'BITCOIN_TESTNET': BtcWallet,
    'SUI': SuiWallet,
    'APTOS': AptosWallet,
};

export interface GenerateOptions {
    wordCount?: number;
    language?: string;
    chain: ChainType;
    count: number;
    processCount?: number;
    derivationCount: number;
    mnemonics?: string[];
}

export interface WalletInfo {
    id: number;
    mnemonic: string;
    address: string;
    privateKey: string;
    chain: string;
    derivationIndex: number;
} 