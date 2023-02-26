# CodeBooster
Boost your code like a pro with our CLI tool.

A CLI tool to setup and configure linting and pre-commit hooks for your Node.js project using ESLint, Husky, and lint-staged.

## Prerequisites
- Node.js (version 12 or above)
- npm or yarn

## Getting Started
To use this tool in your Node.js project, you can follow the steps below:

1. Clone this repository or download the code.
2. Open a terminal and navigate to the directory where the code is located.
3. Install the required dependencies by running:

```
npm install
```

or
```
yarn install
```

4. Run the CLI tool by executing the following command:
```
npm start
```
or
```
yarn start
```

5. Follow the prompts to select your package manager and configure ESLint, Husky, and lint-staged.


## Features
- Easy-to-use CLI tool
- Support for npm, Yarn, and pnpm package managers
- Installation and configuration of ESLint with the @eslint/config preset
- Installation and configuration of Husky with a pre-commit hook to run npm test
- Installation and configuration of lint-staged with a default configuration to run Prettier,ESLint, and git add on staged files

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or improvements.

## License
This project is licensed under the MIT License.