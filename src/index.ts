import { createFilter } from "@rollup/pluginutils";
import { transform } from "@swc/core";
import {
  createSwcOptions,
  excludeHelpers,
  mergeDeep,
  runtimeRequire,
} from "./utils";

import type { Options, JscConfig, ParserConfig } from "@swc/core";
import type { FilterPattern } from "@rollup/pluginutils";
import type { NormalizedOutputOptions, Plugin, RenderedChunk } from "rollup";

const defaultExtensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"];
const tsRegExr = /\.tsx?$/;
const jsxRegExr = /\.[jt]sx$/;
var createCsm2MjsPlugin: CallableFunction;

function transformWithSwc(
  code: string,
  filename: string,
  options: Options,
  transformCommonJS = false
) {
  const isTypeScript = tsRegExr.test(filename);
  const isJSX = jsxRegExr.test(filename);

  const parser: ParserConfig = isTypeScript
    ? { syntax: "typescript", tsx: isJSX }
    : { syntax: "ecmascript", jsx: isJSX };

  if (options.jsc != null) {
    options.jsc.parser = parser;
  }

  options.filename = filename;
  options.plugin = transformCommonJS
    ? createCsm2MjsPlugin({
        replace: options.jsc?.transform?.optimizer?.globals?.vars,
      })
    : undefined;

  return transform(code, options);
}

interface RollupPlginSwcConfig {
  inlcude?: FilterPattern;
  exclude?: FilterPattern;
  minify?: boolean;
  extensions?: string[];
  jscConfig?: JscConfig;
  replace?: Record<string, string>;
  commonjs?: boolean;
}

function rollupPluginSwc(config: RollupPlginSwcConfig = {}): Plugin {
  const {
    extensions = defaultExtensions,
    exclude,
    inlcude,
    minify = false,
    replace = {},
    jscConfig = {},
    commonjs = false,
  } = config;

  if (commonjs && createCsm2MjsPlugin == null) {
    createCsm2MjsPlugin =
      runtimeRequire<Record<"createCsm2MjsPlugin", CallableFunction>>(
        "swc-plugin-cjs2esm"
      ).createCsm2MjsPlugin;

      console.log(createCsm2MjsPlugin)
  }

  const rollupFilter = createFilter(inlcude, excludeHelpers(exclude));
  const extensionRegExp = new RegExp("\\.(" + extensions.join("|") + ")$");
  const filter = (id: string) => extensionRegExp.test(id) && rollupFilter(id);
  const swcOptions = createSwcOptions({
    minify,
    jsc: mergeDeep({}, jscConfig, {
      transform: {
        optimizer: {
          globals: {
            vars: replace,
          },
        },
      },
    }),
  });

  return {
    name: "swc",

    async transform(source: string, id: string) {
      if (!filter(id)) {
        return null;
      }

      const options: Options = JSON.parse(JSON.stringify(swcOptions));

      options.minify = false;
      if (options.jsc != null) {
        options.jsc.minify = { compress: false, mangle: false };
        options.jsc.externalHelpers = true;
      }

      const result = await transformWithSwc(source, id, options, commonjs);

      return result;
    },

    async renderChunk(
      source: string,
      chunk: RenderedChunk,
      outputOptions: NormalizedOutputOptions
    ) {
      if (minify) {
        const { fileName } = chunk;

        const options: Options = JSON.parse(JSON.stringify(swcOptions));
        options.minify = true;
        if (options.jsc != null) {
          options.jsc.externalHelpers = false;
          options.jsc.target = "es2022";
          options.jsc.transform = {};
        }

        return await transformWithSwc(source, fileName, options);
      }

      return null;
    },
  };
}

export { rollupPluginSwc as swcPlugin };
