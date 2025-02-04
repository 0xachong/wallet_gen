import { WalletInfo, GenerateOptions } from '../types';

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