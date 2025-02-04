export type ChainType = 'ETH' | 'BSC' | 'HECO' | 'MATIC' | 'FANTOM' | 'SOL' | 'TRX' | 'SUI' | 'APTOS' | 'BITCOIN' | 'BITCOIN_TESTNET' | 'COSMOS' | 'TON';

export interface GenerateOptions {
    wordCount?: number;
    language?: string;
    chain: ChainType;
    count?: number;
    processCount?: number;
    derivationCount?: number;
    mnemonics?: string[];
} 