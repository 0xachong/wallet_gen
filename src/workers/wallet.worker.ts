import { ethers } from 'ethers';
import { GenerateOptions, WalletInfo } from '../types';

self.onmessage = async (e: MessageEvent<GenerateOptions & { mnemonics?: string[] }>) => {
    const options = e.data;
    try {
        const wallets = options.mnemonics
            ? await generateFromMnemonics(options.mnemonics, options)
            : await generateWallets(options);
        self.postMessage({ type: 'success', data: wallets });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
};

async function generateWallets(options: GenerateOptions): Promise<WalletInfo[]> {
    const { count, derivationCount } = options;
    const wallets: WalletInfo[] = [];

    for (let i = 0; i < count; i++) {
        const groupWallets = await generateWalletGroup(options);
        groupWallets.forEach((wallet, index) => {
            wallet.id = i * derivationCount + index + 1;
            wallets.push(wallet);
        });
        // 报告进度
        self.postMessage({ type: 'progress', current: i + 1, total: count });
    }

    return wallets;
}

async function generateWalletGroup(options: GenerateOptions): Promise<WalletInfo[]> {
    const { wordCount = 12, language = 'en', chain, derivationCount = 1 } = options;
    const wordlist = ethers.wordlists[language] || ethers.wordlists.en;

    let entropyBytes: number;
    if (wordCount <= 12) entropyBytes = 16;
    else if (wordCount <= 18) entropyBytes = 24;
    else entropyBytes = 32;

    const entropy = ethers.utils.randomBytes(entropyBytes);
    const mnemonic = ethers.utils.entropyToMnemonic(entropy, wordlist);
    const wallets: WalletInfo[] = [];

    for (let i = 0; i < derivationCount; i++) {
        const path = `m/44'/60'/0'/0/${i}`;

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
            // ... 其他 case 保持不变
        }
    }
    return wallets;
}

async function generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];
    const wordlist = options.language ? ethers.wordlists[options.language] : ethers.wordlists.en;

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

// 其他生成钱包的逻辑从 wallet.ts 移过来 