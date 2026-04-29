// cli/auth.js
const crypto = require('crypto');
const open = require('open');
const http = require('http');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class CLIAuth {
    constructor() {
        this.configDir = path.join(os.homedir(), '.insighta');
        this.credsFile = path.join(this.configDir, 'credentials.json');
        this.apiUrl = process.env.INSIGHTA_API_URL || 'http://localhost:3000';
    }
    
    async login() {
        // Generate PKCE values
        const state = crypto.randomBytes(16).toString('hex');
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        
        // Start local callback server
        const tokens = await this.startCallbackServer(state, codeVerifier);
        
        // Store tokens
        await this.storeTokens(tokens);
        
        console.log(`✅ Logged in as @${tokens.user.username}`);
        return tokens;
    }
    
    startCallbackServer(state, codeVerifier) {
        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                const url = new URL(req.url, `http://localhost:${config.cliCallbackPort}`);
                
                if (url.pathname === '/callback') {
                    const code = url.searchParams.get('code');
                    const receivedState = url.searchParams.get('state');
                    
                    if (receivedState !== state) {
                        res.writeHead(400);
                        res.end('Invalid state parameter');
                        reject(new Error('Invalid state'));
                        return;
                    }
                    
                    try {
                        // Exchange code for tokens
                        const response = await axios.post(
                            `${this.apiUrl}/auth/github/callback?client=cli`,
                            { code, code_verifier: codeVerifier }
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Login successful!</h1><p>You can close this window.</p>');
                        
                        server.close();
                        resolve(response.data);
                    } catch (error) {
                        res.writeHead(500);
                        res.end('Login failed');
                        reject(error);
                    }
                }
            });
            
            server.listen(config.cliCallbackPort, () => {
                // Open browser for GitHub auth
                const authURL = `${this.apiUrl}/auth/github?client=cli&state=${state}&code_challenge=${codeChallenge}`;
                open(authURL);
            });
        });
    }
    
    async storeTokens(tokens) {
        await fs.mkdir(this.configDir, { recursive: true });
        
        const data = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            user: tokens.user,
            expires_at: Date.now() + 3 * 60 * 1000 // 3 minutes
        };
        
        await fs.writeFile(this.credsFile, JSON.stringify(data, null, 2), { mode: 0o600 });
    }
    
    async getValidToken() {
        try {
            const data = JSON.parse(await fs.readFile(this.credsFile, 'utf8'));
            
            // Check if token is expired
            if (Date.now() >= data.expires_at) {
                // Refresh token
                const response = await axios.post(`${this.apiUrl}/auth/refresh`, {
                    refresh_token: data.refresh_token
                });
                
                data.access_token = response.data.access_token;
                data.refresh_token = response.data.refresh_token;
                data.expires_at = Date.now() + 3 * 60 * 1000;
                
                await this.storeTokens(data);
            }
            
            return data.access_token;
        } catch (error) {
            throw new Error('Not logged in. Please run `insighta login`');
        }
    }
    
    async logout() {
        try {
            const data = JSON.parse(await fs.readFile(this.credsFile, 'utf8'));
            await axios.post(`${this.apiUrl}/auth/logout`, {
                refresh_token: data.refresh_token
            });
        } catch (error) {
            // Ignore errors during logout
        }
        
        try {
            await fs.unlink(this.credsFile);
        } catch (error) {
            // File might not exist
        }
        
        console.log('✅ Logged out successfully');
    }
    
    async whoami() {
        try {
            const data = JSON.parse(await fs.readFile(this.credsFile, 'utf8'));
            console.log(`Username: @${data.user.username}`);
            console.log(`Role: ${data.user.role}`);
            return data.user;
        } catch (error) {
            console.log('Not logged in');
            return null;
        }
    }
}

module.exports = CLIAuth;