export type ChainType = 'ETH' | 'SOL' | 'TRX' | 'BITCOIN' | 'SUI' | 'APTOS' | 'TON';
import { EthWallet } from '@okxweb3/coin-ethereum';
import { SolWallet } from '@okxweb3/coin-solana';
import { BtcWallet } from '@okxweb3/coin-bitcoin';
import { SuiWallet } from '@okxweb3/coin-sui';
import { AptosWallet } from '@okxweb3/coin-aptos';
import { TrxWallet } from '@okxweb3/coin-tron';
import { TonWallet } from '@okxweb3/coin-ton';

export const WalletMap: Record<ChainType, {
    wallet: any;
    addressType: string | null;
}> = {
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
    'SUI': {
        wallet: SuiWallet,
        addressType: null
    },
    'APTOS': {
        wallet: AptosWallet,
        addressType: null
    },
    'TON': {
        wallet: TonWallet,
        addressType: null
    }
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

export interface ConfigType {
    COUNT: number;
    LANGUAGE: 'english' | 'chinese_simplified' | 'chinese_traditional';
    PATH: string;
} 