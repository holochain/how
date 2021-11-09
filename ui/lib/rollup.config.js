import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import postcssLit from 'rollup-plugin-postcss-lit';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcssCQFill from 'cqfill/postcss';

const pkg = require('./package.json');

export default {
  input: `src/index.ts`,
  output: [{ dir: 'dist', format: 'es', sourcemap: true }],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash-es')
  external: [...Object.keys(pkg.dependencies), /lit/],
  watch: {
    include: 'src/**',
    clearScreen: false,
  },
  plugins: [
    postcss({
      inject: false,
      plugins: [postcssCQFill],
    }),
    postcssLit(),
    typescript({
      target: 'es6',
    }),
    resolve(),
    commonjs(),
  ],
};
