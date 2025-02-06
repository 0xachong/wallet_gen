import { WalletInfo, GenerateOptions } from '../types/index';

interface GroupedWallet {
    id: number;
    mnemonic: string;
    derivationIndex: number;
    wallets: Record<string, {
        privateKey: string;
        address: string;
    }>;
}

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
        // 按助记词和派生索引分组
        const groups = wallets.reduce((acc, wallet) => {
            const key = `${wallet.mnemonic}-${wallet.derivationIndex}`;
            if (!acc[key]) {
                acc[key] = {
                    id: wallet.id,
                    mnemonic: wallet.mnemonic,
                    derivationIndex: wallet.derivationIndex,
                    wallets: {}
                };
            }
            acc[key].wallets[wallet.chain] = {
                privateKey: wallet.privateKey,
                address: wallet.address
            };
            return acc;
        }, {} as Record<string, GroupedWallet>);

        // 获取所有出现过的链类型
        const chains = [...new Set(wallets.map(w => w.chain))].sort();

        // CSV 表头
        const headers = [
            '序号',
            '派生索引',
            '助记词',
            ...chains.flatMap(chain => [`${chain}-私钥`, `${chain}-地址`])
        ];

        // 转换钱包数据为 CSV 行
        const rows = Object.values(groups).map((group: GroupedWallet) => [
            group.id,
            group.derivationIndex,
            group.mnemonic,
            ...chains.flatMap(chain => [
                group.wallets[chain]?.privateKey || '',
                group.wallets[chain]?.address || ''
            ])
        ]);

        // 生成 CSV 内容
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    static downloadCsv(csv: string) {
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `钱包信息_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static async generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker();

            worker.onmessage = (e) => {
                const { type, data, error } = e.data;
                switch (type) {
                    case 'success':
                        resolve(data);
                        break;
                    case 'error':
                        reject(new Error(error));
                        break;
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            worker.postMessage({ ...options, mnemonics });
        });
    }
} 