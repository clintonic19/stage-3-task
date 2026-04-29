#!/usr/bin/env node

const { program } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const CLIAuth = require('./auth');
const API = require('./api');

const auth = new CLIAuth();
const api = new API(auth);

program
    .name('insighta')
    .description('Insighta Labs+ CLI Tool')
    .version('1.0.0');

// Auth Commands
program
    .command('login')
    .description('Login to Insighta Labs+')
    .action(async () => {
        const spinner = ora('Starting authentication...').start();
        try {
            await auth.login();
            spinner.succeed('Login successful');
        } catch (error) {
            spinner.fail('Login failed');
            console.error(chalk.red(error.message));
        }
    });

program
    .command('logout')
    .description('Logout from Insighta Labs+')
    .action(async () => {
        await auth.logout();
    });

program
    .command('whoami')
    .description('Show current user')
    .action(async () => {
        await auth.whoami();
    });

// Profiles List Command
program
    .command('profiles-list')
    .alias('profiles list')
    .description('List profiles')
    .option('-g, --gender <gender>', 'Filter by gender')
    .option('-c, --country <country>', 'Filter by country code')
    .option('--age-group <group>', 'Filter by age group')
    .option('--min-age <age>', 'Minimum age', parseInt)
    .option('--max-age <age>', 'Maximum age', parseInt)
    .option('--sort-by <field>', 'Sort by field', 'created_at')
    .option('--order <order>', 'Sort order (asc/desc)', 'desc')
    .option('-p, --page <page>', 'Page number', parseInt, 1)
    .option('-l, --limit <limit>', 'Items per page', parseInt, 10)
    .action(async (options) => {
        const spinner = ora('Fetching profiles...').start();
        
        try {
            const result = await api.listProfiles(options);
            spinner.succeed(`Found ${result.total} profiles`);
            
            // Display table
            const table = new Table({
                head: ['ID', 'Name', 'Gender', 'Age', 'Country', 'Probability'],
                colWidths: [10, 25, 10, 10, 15, 15]
            });
            
            result.data.forEach(profile => {
                table.push([
                    profile.id.slice(0, 8),
                    profile.name,
                    profile.gender || '-',
                    profile.age || '-',
                    profile.country_name || '-',
                    profile.gender_probability ? `${(profile.gender_probability * 100).toFixed(1)}%` : '-'
                ]);
            });
            
            console.log(table.toString());
            console.log(chalk.gray(`\nPage ${result.page} of ${result.total_pages} | Total: ${result.total}`));
            
        } catch (error) {
            spinner.fail('Failed to fetch profiles');
            console.error(chalk.red(error.message));
        }
    });

// Profiles Search Command
program
    .command('profiles-search <query>')
    .alias('profiles search')
    .description('Search profiles using natural language')
    .option('-p, --page <page>', 'Page number', parseInt, 1)
    .option('-l, --limit <limit>', 'Items per page', parseInt, 10)
    .action(async (query, options) => {
        const spinner = ora('Searching profiles...').start();
        
        try {
            const result = await api.searchProfiles(query, options);
            spinner.succeed(`Found ${result.total} results for "${query}"`);
            
            const table = new Table({
                head: ['ID', 'Name', 'Gender', 'Age', 'Country'],
                colWidths: [10, 25, 10, 10, 15]
            });
            
            result.data.forEach(profile => {
                table.push([
                    profile.id.slice(0, 8),
                    profile.name,
                    profile.gender || '-',
                    profile.age || '-',
                    profile.country_name || '-'
                ]);
            });
            
            console.log(table.toString());
            
        } catch (error) {
            spinner.fail('Search failed');
            console.error(chalk.red(error.message));
        }
    });

// Profiles Create Command
program
    .command('profiles-create <name>')
    .alias('profiles create')
    .description('Create a new profile (Admin only)')
    .action(async (name) => {
        const spinner = ora('Creating profile...').start();
        
        try {
            const profile = await api.createProfile(name);
            spinner.succeed('Profile created successfully');
            
            console.log(chalk.green(`\n✅ Profile: ${profile.name}`));
            console.log(chalk.gray(`ID: ${profile.id}`));
            console.log(chalk.gray(`Gender: ${profile.gender} (${(profile.gender_probability * 100).toFixed(1)}%)`));
            console.log(chalk.gray(`Age: ${profile.age} (${profile.age_group})`));
            console.log(chalk.gray(`Country: ${profile.country_name}`));
            
        } catch (error) {
            spinner.fail('Failed to create profile');
            console.error(chalk.red(error.message));
            
            if (error.message.includes('403')) {
                console.log(chalk.yellow('Note: Only admin users can create profiles'));
            }
        }
    });

// Profiles Export Command
program
    .command('profiles-export')
    .alias('profiles export')
    .description('Export profiles to CSV')
    .option('-f, --format <format>', 'Export format', 'csv')
    .option('-g, --gender <gender>', 'Filter by gender')
    .option('-c, --country <country>', 'Filter by country')
    .action(async (options) => {
        const spinner = ora('Exporting profiles...').start();
        
        try {
            const csv = await api.exportProfiles(options);
            const filename = `profiles_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            
            require('fs').writeFileSync(filename, csv);
            spinner.succeed(`Exported to ${filename}`);
            
        } catch (error) {
            spinner.fail('Export failed');
            console.error(chalk.red(error.message));
        }
    });

program.parse();