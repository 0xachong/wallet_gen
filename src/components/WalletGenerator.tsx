import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, InputNumber, Progress, Space, Typography, Row, Col, message, Table, Input, Select } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { WalletInfo, ChainType, GenerateOptions } from '../types';
import { WalletGenerator as Generator } from '../utils/wallet';
import './WalletGenerator.css';

const { Title, Text } = Typography;

export const WalletGenerator: React.FC = () => {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [options, setOptions] = useState<GenerateOptions>({
        wordCount: 12,
        language: 'en',
        chain: 'ETH',
        count: 10,
        processCount: 5,
        derivationCount: 1
    });
    const [mnemonicList, setMnemonicList] = useState('');

    const chains: ChainType[] = ['ETH', 'SOL', 'TRX', 'TON', 'SUI', 'APTOS', 'BITCOIN'];

    useEffect(() => {
        // 设置进度回调
        Generator.onProgress = (current, total) => {
            setProgress({ current, total });
        };

        return () => {
            Generator.onProgress = undefined;
        };
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setProgress({ current: 0, total: options.count });
        try {
            const newWallets = await Generator.generateBatch(options);
            setWallets(newWallets);
            message.success('钱包生成成功！');
        } catch (error) {
            message.error('生成钱包失败！');
            console.error('生成钱包失败:', error);
        }
        setLoading(false);
    };

    const handleDownload = async () => {
        if (wallets.length > 0) {
            const csv = await Generator.exportToCsv(wallets);
            Generator.downloadCsv(csv);
            message.success('文件下载成功！');
        }
    };

    const handleImportMnemonics = async () => {
        const mnemonics = mnemonicList.split('\n').filter(m => m.trim());
        if (!mnemonics.length) return;

        setLoading(true);
        try {
            const newWallets = await Generator.generateFromMnemonics(mnemonics, options);
            setWallets(newWallets);
            message.success('钱包生成成功！');
        } catch (error) {
            message.error('生成钱包失败！');
            console.error('生成钱包失败:', error);
        }
        setLoading(false);
    };

    const handleChainChange = (value: ChainType) => {
        setOptions(prev => ({ ...prev, chain: value }));
        if (value === 'TON') {
            message.warning('注意: TON 生成私钥及地址目前仅支持 OKX 钱包，与其他钱包可能不兼容');
        }
    };

    return (
        <div className="wallet-generator">
            <Card bordered={false} style={{ padding: '8px' }}>
                <div className="tips-card" style={{ marginBottom: '8px' }}>
                    <Text type="secondary">
                        Tips: 钱包生成过程均在本地电脑完成，我们无法获取到您的助记词及私钥！请保管好您的助记词及私钥！
                    </Text>
                </div>

                {/* 参数设置卡片 */}
                <Card
                    title="参数设置"
                    className="section-card"
                    style={{ marginBottom: '8px' }}
                    bodyStyle={{ padding: '12px' }}
                    headStyle={{ padding: '8px 12px' }}
                >
                    {/* 链选择 */}
                    <div style={{ marginBottom: '12px' }}>
                        <Title level={5} style={{ marginBottom: '8px' }}>选择链</Title>
                        <Radio.Group
                            value={options.chain}
                            onChange={e => handleChainChange(e.target.value)}
                            buttonStyle="solid"
                            size="middle"
                        >
                            <Space wrap size={4}>
                                {chains.map(chain => (
                                    <Radio.Button key={chain} value={chain}>{chain}</Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>

                    {/* 其他参数 */}
                    <Row gutter={[8, 8]}>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>助记词长度</Title>
                            <Select
                                size="middle"
                                value={options.wordCount as 12 | 15 | 18 | 21 | 24}
                                onChange={(value: 12 | 15 | 18 | 21 | 24) => setOptions(prev => ({ ...prev, wordCount: value }))}
                                style={{ width: '100%' }}
                                options={[
                                    { label: '12位助记词', value: 12 },
                                    { label: '15位助记词', value: 15 },
                                    { label: '18位助记词', value: 18 },
                                    { label: '21位助记词', value: 21 },
                                    { label: '24位助记词', value: 24 },
                                ]}
                                defaultValue={12}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>助记词数量</Title>
                            <InputNumber
                                size="middle"
                                min={1}
                                max={100}
                                value={options.count}
                                onChange={value => setOptions(prev => ({ ...prev, count: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>派生钱包数量</Title>
                            <InputNumber
                                size="middle"
                                min={1}
                                max={20}
                                value={options.derivationCount}
                                onChange={value => setOptions(prev => ({ ...prev, derivationCount: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>导入助记词</Title>
                            <Input.TextArea
                                placeholder="每行一个助记词，例如：
word1 word2 word3 ... word12
word1 word2 word3 ... word12"
                                rows={4}
                                value={mnemonicList}
                                onChange={e => setMnemonicList(e.target.value)}
                            />
                        </Col>
                    </Row>

                    {/* 操作按钮 */}
                    <div style={{ marginTop: '12px' }}>
                        <Space size={8}>
                            <Button type="primary" size="middle" icon={<ReloadOutlined />} onClick={handleGenerate} loading={loading}>
                                {loading ? '生成中...' : '重新生成'}
                            </Button>
                            <Button type="primary" size="middle" onClick={handleImportMnemonics} disabled={!mnemonicList.trim()} loading={loading}>从助记词生成</Button>
                            <Button size="middle" icon={<DownloadOutlined />} onClick={handleDownload} disabled={wallets.length === 0}>下载表格</Button>
                        </Space>

                        {/* 进度条 */}
                        {loading && (
                            <div style={{ marginTop: '8px' }}>
                                <Progress
                                    percent={Math.round((progress.current / progress.total) * 100)}
                                    status="active"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* 钱包列表卡片 */}
                {wallets.length > 0 && (
                    <Card
                        title="生成的钱包列表"
                        className="section-card"
                        bodyStyle={{ padding: '8px' }}
                        headStyle={{ padding: '8px 12px' }}
                    >
                        <div className="table-container">
                            <Table
                                dataSource={wallets}
                                rowKey={record => `${record.chain}-${record.id}-${record.derivationIndex}`}
                                columns={[
                                    {
                                        title: '序号',
                                        dataIndex: 'id',
                                        key: 'id',
                                        width: 80,
                                    },
                                    {
                                        title: '链',
                                        dataIndex: 'chain',
                                        key: 'chain',
                                        width: 100,
                                    },
                                    {
                                        title: '派生索引',
                                        dataIndex: 'derivationIndex',
                                        key: 'derivationIndex',
                                        width: 100,
                                    },
                                    {
                                        title: '助记词',
                                        dataIndex: 'mnemonic',
                                        key: 'mnemonic',
                                        width: '25%',
                                        render: (text: string) => {
                                            const words = text.split(' ');
                                            const displayText = words.length > 6
                                                ? `${words.slice(0, 3).join(' ')} ... ${words.slice(-3).join(' ')}`
                                                : text;

                                            return (
                                                <Typography.Text
                                                    className="monospace-text clickable-text"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(text);
                                                        message.success('助记词已复制到剪贴板');
                                                    }}
                                                >
                                                    {displayText}
                                                </Typography.Text>
                                            );
                                        },
                                    },
                                    {
                                        title: '私钥',
                                        dataIndex: 'privateKey',
                                        key: 'privateKey',
                                        width: '25%',
                                        render: (text: string) => (
                                            <Typography.Text
                                                className="monospace-text clickable-text"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(text);
                                                    message.success('私钥已复制到剪贴板');
                                                }}
                                            >
                                                {text.slice(0, 10)}...{text.slice(-8)}
                                            </Typography.Text>
                                        ),
                                    },
                                    {
                                        title: '钱包地址',
                                        dataIndex: 'address',
                                        key: 'address',
                                        width: '25%',
                                        render: (text: string) => {
                                            if (typeof text !== 'string') return text;
                                            return (
                                                <Typography.Text
                                                    className="monospace-text clickable-text"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(text);
                                                        message.success('地址已复制到剪贴板');
                                                    }}
                                                >
                                                    {text.slice(0, 6)}...{text.slice(-4)}
                                                </Typography.Text>
                                            );
                                        },
                                    }
                                ]}
                                pagination={false}
                                scroll={{ x: true }}
                                size="small"
                            />
                        </div>
                    </Card>
                )}
            </Card>
        </div>
    );
}; 