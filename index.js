#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs')
const util = require('util')
const execPromise = util.promisify(exec)
const inquirer = require('inquirer');
const packageJson = require('./package.json')
const devDependencies = packageJson.devDependencies || {}

let packageManager;
let packageInstallPrefix;

const DEFAULT_LINT_STAGED_CONFIG = {
  '*.{js,jsx,ts,tsx,json,md,mdx,html,css,scss,sass,less}': [
    'prettier --write',
    'eslint --fix',
    'git add',
  ],
};

async function checkValidProject() {
  const packageJsonExists = await fs.promises.access('./package.json')
    .then(() => true)
    .catch(() => false)

  if (!packageJsonExists) {
    throw new Error('package.json not found in current directory. This script should be run from the root of your project.')
  }
}

async function askUserPackageManager() {
  const response = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you want to use?',
      choices: ['yarn', 'npm', 'pnpm'],
    },
  ]);
  packageManager = response.packageManager;
  switch (packageManager) {
    case 'yarn':
      packageInstallPrefix = 'yarn add'
      break;
    case 'npm':
    case 'pnpm':
      packageInstallPrefix = `${packageManager} install`
  }
}

async function executeESLintInitConfig() {
  const npmInit = spawn('npm', ['init', '@eslint/config'], { stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    npmInit.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm init @eslint/config exited with code ${code}`));
      }
    });
  });
}

async function installAndConfigEslint() {
  const eslintInstalled = Boolean(devDependencies.eslint)

  if (!eslintInstalled) {
    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'installEslint',
      message: 'eslint is not installed in this project. Would you like to install and configure it now?',
      default: true,
    })
    if (answer.installEslint) {
      await executeESLintInitConfig()
      console.log('npm init @eslint/config completed successfully!');
      console.log('eslint has been installed and configured in this project.')
    }
  }
}

async function installAndConfigHusky() {
  try {
    // Check if husky is already installed by looking at package.json devDependencies
    const huskyInstalled = Boolean(devDependencies.husky)

    if (huskyInstalled) {
      console.log('Husky already installed in project!');
      return;
    }
  } catch (err) {
    // If npm command fails, assume husky is not installed
  }

  // Prompt user whether they want to install and configure husky
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmInstall',
    message: 'Husky is not yet installed in this project. Would you like to install and configure it?',
  });

  if (answer.confirmInstall) {
    // Install husky and add pre-commit hook using the latest way
    await execPromise(`${packageInstallPrefix} husky -D`);
    await execPromise(`npx husky-init && ${packageManager} install`);
    await execPromise('npx husky add .husky/pre-commit "npm test"');
    console.log('Husky installed and configured successfully!');
  } else {
    console.log('Skipping husky installation and configuration.');
  }
}

async function installAndConfigLintStaged() {
  const hasLintStaged = devDependencies['lint-staged'];

  if (!hasLintStaged) {
    const response = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installLintStaged',
        message:
          'Lint-staged is not installed in the project. Do you want to install and configure it?',
        default: true,
      },
    ]);

    if (response.installLintStaged) {
      const lintStagedConfigFile = '.lintstagedrc.json';
      const installCommand = `${packageInstallPrefix} -D lint-staged`;

      try {
        await execPromise(installCommand);

        const configFileContent = JSON.stringify(
          DEFAULT_LINT_STAGED_CONFIG,
          null,
          2
        );

        fs.writeFileSync(lintStagedConfigFile, configFileContent, 'utf-8');

        await execPromise('npx husky add .husky/lint-staged "npx lint-staged"');
        console.log(
          `Lint-staged installed and configured with default configuration in ${lintStagedConfigFile}`
        );
      } catch (error) {
        console.error('Failed to install and configure lint-staged', error);
      }
    }
  } else {
    console.log('Lint-staged is already installed in the project.');
  }
}

async function installAndConfigCommitLint() {
  try {
    // Check whether commitlint is already installed
    const commentLintInstalled = devDependencies['@commitlint/cli'];
    if (commentLintInstalled) {
      console.log('commitlint is already installed in this project.')
      return;
    }
    // Prompt user whether to install and configure commitlint
    const { installCommitLint } = await inquirer.prompt({
      type: 'confirm',
      name: 'installCommitLint',
      message: 'commitlint is not yet installed in this project. Would you like to install and configure it now?',
      default: true
    })

    if (!installCommitLint) {
      console.log('commitlint is not installed.')
      return
    }

    // Install and configure commitlint
    console.log('Installing commitlint...')
    await exec(`${packageInstallPrefix} @commitlint/cli @commitlint/config-conventional -D`)
    console.log('Configuring commitlint...')
    await exec('echo \'{ "extends": ["@commitlint/config-conventional"] }\' > .commitlintrc.json')
    console.log('commitlint is now installed and configured.')
    await execPromise('npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}"');
  } catch (err) {
    console.error('Error:', err)
  }
}

async function run() {
  try {
    await checkValidProject()
    await askUserPackageManager()

    await installAndConfigEslint()

    await installAndConfigHusky()

    await installAndConfigLintStaged()

    await installAndConfigCommitLint()
  } catch (err) {
    console.error(err.message)
  }
}

run()
