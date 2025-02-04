# 助记词钱包地址生成器

## 功能

- 批量生成助记词
- 批量生成钱包地址
- 批量生成钱包私钥

### 配置说明

在 `config.js` 文件中可以设置以下参数：

- `COUNT`: 需要生成的钱包数量
- `PATH`: 导出文件路径
- `LANGUAGE`: 助记词语言（支持：english, chinese_simplified, chinese_traditional）

## 技术框架

react + vite + typescript + antd

## 输出格式

生成的 CSV 文件包含以下字段：

- 序号
- 助记词
- 钱包地址
- 私钥

## 安全提示

- 请妥善保管生成的助记词和私钥
- 建议在离线环境下使用本工具
- 不要将私钥分享给他人

## 开源协议

MIT License

## 免责声明

本工具仅供学习研究使用，使用本工具所产生的任何后果由使用者自行承担。
