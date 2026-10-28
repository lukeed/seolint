---
title: Install
summary: Install seolint with npm, pnpm, Yarn, or Bun, and check the Node or Bun version that it needs, and that its TypeScript config needs.
---

# Install

seolint is a package on npm. Add it to the development dependencies of your site:

```sh
npm install --save-dev seolint
```

With another package manager:

```sh
pnpm add --save-dev seolint
yarn add --dev seolint
bun add --dev seolint
```

## Requirements

- **Node.js 22.8 or later**, or **Bun**.
- To load a `seolint.config.ts` file, Node needs version 22.18 or later, because it strips the types itself. Bun loads TypeScript at any version. On an older Node, use `seolint.config.mjs` instead.

## Check the install

Print the version:

```sh
npx seolint --version
```

List every rule, with its setting and description:

```sh
npx seolint --rules
```

## Run it without installing

To try seolint once, run it with `npx`, or `bunx` on Bun:

```sh
npx seolint public --host https://example.com
```

## Next steps

See the [CLI](/docs/cli/) for every option, or set up your [config file](/docs/config/).
