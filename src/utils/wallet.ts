import { ethers } from 'ethers';
import { WalletInfo, ChainType, GenerateOptions } from '../types';
import { Wordlist } from '@ethersproject/wordlists';

export class WalletGenerator {
    static async generateWallet(options: GenerateOptions): Promise<WalletInfo> {
        const { wordCount = 12, language = 'en', chain } = options;

        // 获取对应的词库
        const wordlist = this.getWordlist(language);

        // 固定熵的大小为 16/24/32 字节
        let entropyBytes: number;
        if (wordCount <= 12) entropyBytes = 16;      // 128 bits
        else if (wordCount <= 18) entropyBytes = 24; // 192 bits
        else entropyBytes = 32;                      // 256 bits

        const entropy = ethers.utils.randomBytes(entropyBytes);
        const mnemonic = ethers.utils.entropyToMnemonic(entropy, wordlist);
        console.log('mnemonic:', mnemonic);
        // 根据不同链类型生成对应的钱包
        switch (chain) {
            case 'ETH':
            case 'BSC':
            case 'HECO':
            case 'MATIC':
            case 'FANTOM': {
                // EVM兼容链使用相同的生成方式
                const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, undefined, wordlist);
                const wallet = new ethers.Wallet(hdNode.privateKey);
                return {
                    id: 0,
                    mnemonic,
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    chain
                };
            }

            case 'BITCOIN':
            case 'BITCOIN_TESTNET': {
                // 比特币钱包生成
                const path = chain === 'BITCOIN' ? "m/44'/0'/0'/0/0" : "m/44'/1'/0'/0/0";
                const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, undefined, wordlist).derivePath(path);
                return {
                    id: 0,
                    mnemonic,
                    address: `bc${chain === 'BITCOIN_TESTNET' ? 't' : ''}1${hdNode.address}`,
                    privateKey: hdNode.privateKey,
                    chain
                };
            }

            // 其他链的实现可以根据需要添加
            default:
                throw new Error(`暂不支持 ${chain} 链的钱包生成`);
        }
    }

    // 获取词库
    private static getWordlist(language: string): Wordlist {
        switch (language.toLowerCase()) {
            case 'en':
            case 'english':
                return ethers.wordlists.en;
            case 'zh':
            case 'zh_cn':
            case 'chinese_simplified':
                return ethers.wordlists.zh;
            case 'zh_tw':
            case 'chinese_traditional':
                return ethers.wordlists.zh_tw;
            default:
                return ethers.wordlists.en;
        }
    }

    static async generateBatch(options: GenerateOptions): Promise<WalletInfo[]> {
        const { count = 1, processCount = 1 } = options;
        const wallets: WalletInfo[] = [];

        // 使用Promise.all实现并行生成
        const batchSize = Math.ceil(count / processCount);
        const batches = Array.from({ length: processCount }, (_, i) => {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, count);
            return Array.from({ length: end - start }, () => this.generateWallet(options));
        });

        try {
            const results = await Promise.all(batches.map(batch => Promise.all(batch)));
            results.flat().forEach((wallet, index) => {
                wallet.id = index + 1;
                wallets.push(wallet);
            });
        } catch (error) {
            console.error('批量生成钱包失败:', error);
            throw error;
        }

        return wallets;
    }

    static async exportToCsv(wallets: WalletInfo[]): Promise<string> {
        const header = ['序号', '链', '助记词', '钱包地址', '私钥'].join(',');
        const rows = wallets.map(w =>
            [w.id, w.chain, w.mnemonic, w.address, w.privateKey].join(',')
        );

        return [header, ...rows].join('\n');
    }

    static downloadCsv(content: string, filename: string = 'wallets.csv'): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
            return;
        }

        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
} 