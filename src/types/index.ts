export type ChainType = 'ETH' | 'BSC' | 'HECO' | 'MATIC' | 'FANTOM' | 'SOL' | 'TRX' | 'SUI' | 'APTOS' | 'BITCOIN' | 'BITCOIN_TESTNET' | 'COSMOS' | 'TON';

export type LanguageType = 'en' | 'zh' | 'zh_tw';

export interface WalletInfo {
    id: number;
    mnemonic: string;
    address: string;
    privateKey: string;
    chain: ChainType;
    derivationIndex: number;
}

export interface ConfigType {
    COUNT: number;
    LANGUAGE: 'english' | 'chinese_simplified' | 'chinese_traditional';
    PATH: string;
}

export interface GenerateOptions {
    wordCount?: 12 | 15 | 18 | 21 | 24;
    language?: LanguageType;
    chain: ChainType;
    count: number;
    processCount: number;
    derivationCount: number;
} 