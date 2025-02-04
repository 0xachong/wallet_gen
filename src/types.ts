export type ChainType = 'ETH' | 'BSC' | 'HECO' | 'MATIC' | 'FANTOM' | 'SOL' | 'TRX' | 'SUI' | 'APTOS' | 'BITCOIN' | 'BITCOIN_TESTNET' | 'COSMOS' | 'TON';
import { EthWallet } from '@okxweb3/coin-ethereum';
import { SolWallet } from '@okxweb3/coin-solana';
import { BtcWallet } from '@okxweb3/coin-bitcoin';
import { SuiWallet } from '@okxweb3/coin-sui';
import { AptosWallet } from '@okxweb3/coin-aptos';
import { TrxWallet } from '@okxweb3/coin-tron';
export const WalletMap = {
    'ETH': {
        wallet: EthWallet,
        addressType: null
    },
    'TRX': {
        wallet: TrxWallet,
        addressType: null
    },
    'SOL': {
        wallet: SolWallet,
        addressType: null
    },
    'BITCOIN': {
        wallet: BtcWallet,
        addressType: 'segwit_taproot'
    },
    // 'BITCOIN_TESTNET': BtcWallet,
    'SUI': {
        wallet: SuiWallet,
        addressType: null
    },
    'APTOS': {
        wallet: AptosWallet,
        addressType: null
    },
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