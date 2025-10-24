<div align="center">
  <img src="icon.png" alt="ETH Dev Faucet Logo" width="120" height="120">
  
  # 💧 ETH Dev Faucet Extension for VS Code
  
  [![Version](https://img.shields.io/badge/version-0.1.5-blue.svg)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
  [![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/smolgroot.eth-dev-faucet?color=blue&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
  [![Downloads](https://img.shields.io/visual-studio-marketplace/d/smolgroot.eth-dev-faucet?color=green)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
  [![Installs](https://img.shields.io/visual-studio-marketplace/i/smolgroot.eth-dev-faucet?color=green)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
  [![Rating](https://img.shields.io/visual-studio-marketplace/r/smolgroot.eth-dev-faucet?color=yellow)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.md)
  [![GitHub](https://img.shields.io/badge/GitHub-smolgroot%2Feth--dev--faucet--vscode-blue?logo=github)](https://github.com/smolgroot/eth-dev-faucet-vscode)
</div>

---

This VS Code extension provides a convenient faucet interface for Ethereum development directly in your editor sidebar.

https://github.com/user-attachments/assets/2d6522d0-76d6-4955-8f9b-9268389dbf3a

## Quick Start

1. **Install** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
2. **Open** the ETH Faucet panel in VS Code sidebar
3. **Configure** your RPC endpoint (defaults to `localhost:8545`)
4. **Send** test ETH to development addresses

## Features

* **Local Node Connection** - Connects to local Ethereum development nodes
* **Account Management** - Displays account balances and addresses
* **Test ETH Distribution** - Send test ETH to development accounts
* **Transaction History** - Track all faucet transactions
* **RPC Endpoint Management** - Easy switching between different local nodes
* **Auto-Detection** - Automatically detects blockchain configuration files
* **Workspace Integration** - Workspace-specific RPC settings
* **One-Click Refresh** - Update connection status instantly

Perfect for **Hardhat**, **Foundry**, **Geth**, and other development workflows.

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "ETH Dev Faucet"
4. Click Install

### From Command Line
```bash
code --install-extension smolgroot.eth-dev-faucet
```

### Manual Installation
Download the latest `.vsix` file from [Releases](https://github.com/smolgroot/eth-dev-faucet-vscode/releases) and install via:
```bash
code --install-extension eth-dev-faucet-x.x.x.vsix
```

## Usage

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

## Configuration

The extension automatically detects blockchain projects and configures itself. You can manually adjust settings:

- **RPC URL**: Set your preferred Ethereum node endpoint
- **Frequent Addresses**: Manage commonly used development addresses

## Supported Development Tools

- **Hardhat** - Local development node
- **Foundry/Anvil** - Fast Ethereum testing framework
- **Geth** - Go Ethereum client in dev mode
- **Ganache** - Personal blockchain for development
- **Custom RPC** - Any Ethereum-compatible local node

## Development

Built for local Ethereum development - **not intended for mainnet use**.

## 📈 Extension Stats

<div align="center">
  
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/smolgroot.eth-dev-faucet?style=for-the-badge&color=4CAF50)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/smolgroot.eth-dev-faucet?style=for-the-badge&color=2196F3)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/smolgroot.eth-dev-faucet?style=for-the-badge&color=FF9800)](https://marketplace.visualstudio.com/items?itemName=smolgroot.eth-dev-faucet)

</div>

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/smolgroot/eth-dev-faucet-vscode/issues) or submit a PR!

## License

MIT License - see LICENSE.md for details.
