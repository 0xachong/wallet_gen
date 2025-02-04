import { ethers } from 'ethers';
import { WalletInfo, ChainType, GenerateOptions } from '../types';
import { Wordlist } from '@ethersproject/wordlists';

export class WalletGenerator {
    private static worker: Worker | null = null;

    private static getWorker(): Worker {
        if (!this.worker) {
            this.worker = new Worker(
                new URL('../workers/wallet.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }
        return this.worker;
    }

    static async generateWallet(options: GenerateOptions): Promise<WalletInfo[]> {
        const { wordCount = 12, language = 'en', chain, derivationCount = 1 } = options;
        const wordlist = this.getWordlist(language);

        let entropyBytes: number;
        if (wordCount <= 12) entropyBytes = 16;
        else if (wordCount <= 18) entropyBytes = 24;
        else entropyBytes = 32;

        const entropy = ethers.utils.randomBytes(entropyBytes);
        const mnemonic = ethers.utils.entropyToMnemonic(entropy, wordlist);
        const wallets: WalletInfo[] = [];

        // 生成多个派生钱包
        for (let i = 0; i < derivationCount; i++) {
            const path = `m/44'/60'/0'/0/${i}`; // 使用标准的 BIP44 路径

            switch (chain) {
                case 'ETH':
                case 'BSC':
                case 'HECO':
                case 'MATIC':
                case 'FANTOM': {
                    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, undefined, wordlist).derivePath(path);
                    const wallet = new ethers.Wallet(hdNode.privateKey);
                    wallets.push({
                        id: 0,
                        mnemonic,
                        address: wallet.address,
                        privateKey: wallet.privateKey,
                        chain,
                        derivationIndex: i
                    });
                    break;
                }

                case 'BITCOIN':
                case 'BITCOIN_TESTNET': {
                    // 比特币钱包生成
                    const path = chain === 'BITCOIN' ? "m/44'/0'/0'/0/0" : "m/44'/1'/0'/0/0";
                    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, undefined, wordlist).derivePath(path);
                    wallets.push({
                        id: 0,
                        mnemonic,
                        address: `bc${chain === 'BITCOIN_TESTNET' ? 't' : ''}1${hdNode.address}`,
                        privateKey: hdNode.privateKey,
                        chain,
                        derivationIndex: i
                    });
                    break;
                }

                // 其他链的实现可以根据需要添加
                default:
                    throw new Error(`暂不支持 ${chain} 链的钱包生成`);
            }
        }

        return wallets;
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
        return new Promise((resolve, reject) => {
            const worker = this.getWorker();

            worker.onmessage = (e) => {
                const { type, data, error, current, total } = e.data;
                switch (type) {
                    case 'success':
                        resolve(data);
                        break;
                    case 'error':
                        reject(new Error(error));
                        break;
                    case 'progress':
                        // 触发进度更新事件
                        this.onProgress?.(current, total);
                        break;
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            worker.postMessage(options);
        });
    }

    static onProgress?: (current: number, total: number) => void;

    static async exportToCsv(wallets: WalletInfo[]): Promise<string> {
        const header = ['序号', '链', '助记词', '钱包地址', '私钥'].join(',');
        const rows = wallets.map(w =>
            [w.id, w.chain, w.mnemonic, w.address, w.privateKey].join(',')
        );

        return [header, ...rows].join('\n');
    }

    static downloadCsv(content: string, filename: string = 'wallets.csv'): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static async generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
        const wallets: WalletInfo[] = [];
        const wordlist = this.getWordlist(options.language);

        for (let i = 0; i < mnemonics.length; i++) {
            const mnemonic = mnemonics[i].trim();
            if (!mnemonic) continue;

            for (let j = 0; j < options.derivationCount; j++) {
                const path = `m/44'/60'/0'/0/${j}`;
                const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, undefined, wordlist).derivePath(path);
                const wallet = new ethers.Wallet(hdNode.privateKey);

                wallets.push({
                    id: wallets.length + 1,
                    mnemonic,
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    chain: options.chain,
                    derivationIndex: j
                });
            }
        }

        return wallets;
    }
} 