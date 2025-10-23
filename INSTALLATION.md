# 🚀 Installation & Testing Guide

## Quick Test in VS Code

1. **Open the extension folder in VS Code:**
   ```bash
   cd /home/user/repos/geth-dev-faucet/vscode-extension
   code .
   ```

2. **Start Extension Development Host:**
   - Press `F5` or go to Run & Debug > Launch Extension
   - This opens a new VS Code window with your extension loaded

3. **Test the extension:**
   - Open a folder with blockchain config files (hardhat.config.js, etc.)
   - Look for "ETH Faucet" in the Explorer sidebar
   - Try the commands from Command Palette (`Ctrl+Shift+P`):
     - "Send ETH"
     - "Refresh"

## Building for Distribution

### 1. Install VSCE (Visual Studio Code Extensions)
```bash
npm install -g @vscode/vsce
```

### 2. Build and Package the Extension
```bash
# Install dependencies
npm install

# Package the extension (compiles + creates .vsix)
npm run package

# OR: Compile + publish directly to marketplace
npm run publish
```

**Available npm scripts:**
- `npm run compile` - Compile TypeScript to JavaScript
- `npm run package` - Compile + create .vsix file for local installation
- `npm run publish` - Compile + publish directly to VS Code Marketplace

This creates a `.vsix` file like `eth-dev-faucet-0.0.1.vsix`

### 3. Install the .vsix Extension

#### Option A: Command Line Installation
```bash
code --install-extension eth-dev-faucet-0.0.1.vsix
```

#### Option B: VS Code GUI Installation
1. Open VS Code
2. Press `Ctrl+Shift+P` (Command Palette)
3. Type "Extensions: Install from VSIX..."
4. Select the `.vsix` file you created
5. Restart VS Code if prompted

#### Option C: Extensions View Installation
1. Open Extensions view (`Ctrl+Shift+X`)
2. Click the `...` menu in the top-right
3. Select "Install from VSIX..."
4. Choose your `.vsix` file

### 4. Verify Installation
- Check Extensions view for "Geth Dev Faucet"
- Open a blockchain project folder
- Look for "ETH Faucet" in Explorer sidebar

## Complete Step-by-Step Example

```bash
# 1. Navigate to extension directory
cd /home/user/repos/geth-dev-faucet/vscode-extension

# 2. Install VSCE globally (one time setup)
npm install -g @vscode/vsce

# 3. Install dependencies
npm install

# 4. Package the extension (compiles + creates .vsix)
npm run package

# 5. Install the generated .vsix file
code --install-extension eth-dev-faucet-0.1.4.vsix

# 6. Restart VS Code
```

After installation, the extension will:
- ✅ Auto-activate when you open blockchain projects
- ✅ Show "ETH Faucet" panel in Explorer sidebar
- ✅ Provide commands in Command Palette
- ✅ Test connection to local geth/hardhat nodes

## Troubleshooting

**"Publisher is required" error:**
- The package.json includes a publisher field

**"Repository field is required" error:**
- Added repository field pointing to GitHub

**Extension not showing:**
- Make sure you have blockchain config files in your workspace
- Try opening Command Palette and search for "ETH Faucet" commands

## Testing with Local Geth

1. Start geth in dev mode:
   ```bash
   geth --dev --http --http.api eth,web3,dev --http.corsdomain "*"
   ```

2. Use the extension to send ETH to test addresses

## Features to Test

- ✅ Connection status detection
- ✅ Account balance display  
- ✅ Send ETH functionality
- ✅ Transaction history
- ✅ RPC endpoint management
- ✅ Frequent addresses
- ✅ Workspace-specific settings