# 💧 ETH Dev Faucet Extension for VS Code

This VS Code extension provides a convenient faucet interface for Ethereum development directly in your editor sidebar.

## ✨ Features

* **Local Node Connection** - Connects to local Ethereum development nodes
* **Account Management** - Displays account balances and addresses
* **Test ETH Distribution** - Send test ETH to development accounts
* **Transaction History** - Track all faucet transactions
* **RPC Endpoint Management** - Easy switching between different local nodes
* **Auto-Detection** - Automatically detects blockchain configuration files
* **Workspace Integration** - Workspace-specific RPC settings

Perfect for **Hardhat**, **Foundry**, **Geth**, and other development workflows.

## 🚀 Installation

Install from the VS Code Extensions marketplace or load the VSIX file directly.

## 📖 Usage

1. **Open the Panel** - Open the ETH Faucet panel in the VS Code sidebar
2. **Configure RPC** - Click the plug icon (🔌) in the Connection view to set your RPC endpoint (defaults to `localhost:8545`)
3. **View Accounts** - Browse local account balances in the Accounts view
4. **Send Test ETH** - Use the faucet interface to send ETH to addresses
5. **Monitor History** - Track transaction status in the History view

### 🔌 RPC Endpoint Management

- **Easy Configuration** - Click the plug button in the Connection view to change RPC endpoints
- **Default Setting** - Automatically connects to `localhost:8545`
- **URL Validation** - Built-in validation for RPC endpoint URLs
- **Auto-Refresh** - Connection status updates automatically when endpoint changes

### 💰 Faucet Operations

- **Amount Range** - Send between 0.1 and 10 ETH per transaction
- **Address Validation** - Automatic Ethereum address format validation
- **Quick Send** - Send to recently used addresses with one click
- **Frequent Addresses** - Save commonly used addresses for easy access

### 📊 Account & History Tracking

- **Balance Display** - Real-time account balance updates
- **Transaction History** - Complete record of all faucet transactions
- **Status Tracking** - Success/failure status for each transaction
- **Address Management** - Recently used addresses for quick access

## ⚙️ Configuration

The extension automatically detects blockchain projects and configures itself. You can manually adjust settings:

- **RPC URL**: Set your preferred Ethereum node endpoint
- **Frequent Addresses**: Manage commonly used development addresses

## 🛠️ Supported Development Tools

- **Hardhat** - Local development node
- **Foundry/Anvil** - Fast Ethereum testing framework
- **Geth** - Go Ethereum client in dev mode
- **Ganache** - Personal blockchain for development
- **Custom RPC** - Any Ethereum-compatible local node

## 🔧 Development

Built for local Ethereum development - **not intended for mainnet use**.

## 📄 License

MIT License - see LICENSE.md for details.
