# rollup-plugin-swc-core

An opinionated swc wrapper plugin for Rollup.

This plugin utilises most of the @swc/core functionalities (except CSS; see rollup-plugin-parcel-css):

1. convert latest EcmaScript into backward compatible version of JavaScript
2. transpile TypeScript to JavaScript (though still need Typescript for types check)
3. transpile JSX
4. replace targeted variables in files while transpiling; e.g. replace `process.env.NODE_ENV` with "production" / "development" etc.
5. minify: mangle and compress output
6. [experimental] transpile CommonJS module to ESM module (kind of rollup-plugin-commonjs replacement)

## Install

```console
npm i rollup-plugin-swc-core -D
```

## Usage

> default EcmaScript target is es2020.

```javascript
import { swcPlugin } from "rollup-plugin-swc-core";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/app.js",
    format: "umd",
  },
  plugins: [
    nodeResolve({
      extensions: [".js", ".json", ".tsx", ".ts"],
    }),
    commonjs(),
    swcPlugin({
      jscConfig: { target: "es5" },
      minify: true
    }),
  ],
};
```

## Options

```typescript
import type { FilterPattern } from "@rollup/pluginutils";
import type { JscConfig, Options } from "@swc/core";

interface RollupPluginSwcConfig {
  inlcude?: FilterPattern;
  exclude?: FilterPattern;
  minify?: boolean;
  extensions?: string[];
  jscConfig?: JscConfig;
  replace?: Record<string, string>;
  plugin: Options["plugin"];
}
```

### include

A pattern which specifies the files to to act upon. By default all files defined by configuration `extensions` are targeted.

Type: `Array<string | RegExp> | string | RegExp | null`

Default: `null`

### exclude

A pattern which specifies the files to to be ignored by plugin. By default no files defined by configuration `extensions` are ignored.

Type: `Array<string | RegExp> | string | RegExp | null`

Default: `null`

### minify

Minify code using [@swc/core minification](https://swc.rs/docs/configuration/minification)

Type: `boolean`

Default: `false`

By default it uses following @swc/core config. Advance config can be provided using `jscConfig`.

If `true` then `process.env.NODE_ENV` will be replaced with `"production"` otherwise `"development"`.

```javascript
options.jsc.minify = { compress: true, mangle: true };
```

### extensions

Specifies the extensions of file to act upon.

Type: `Array<string>`

Default: `["js", "jsx", "ts", "tsx", "mjs", "cjs"]`

> Note: The file extensions don't contain `.` dot

### jscConfig

Provides jsc configuration to @swc/core. See [JscConfig](https://swc.rs/docs/configuration/compilation) for more details

Type: `JscConfig`

Default: `{}`

### replace

Replace targeted variables in files while transpiling.

Type: `Record<string, string>`

example

```javascript
swcPlugin({
  replace: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
```

## JSX

The plugin identifies JSX file based on extensions `.jsx` and `.tsx` and convert using [JSX Runtime](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) introduced in React 17 instead of `React.createElement`.

**classic** runtime transformation can be achieved using JscConfig:

```javascript
swcPlugin({
  jscConfig: {
    transform: {
      react: {
        runtime: "classic",
      },
    },
  },
});
```

JSX prgma and pragmaFrag can also be provided using `jscConfig.transform.react`. e.g. preact:

```javascript
swcPlugin({
  jscConfig: {
    transform: {
      react: {
        runtime: "classic",
        pragma: "h",
      },
    },
  },
});
```
