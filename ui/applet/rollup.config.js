import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import visualizer from 'rollup-plugin-visualizer';

import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/index.ts',
  output: {
    format: 'es',
    dir: 'dist',
    sourcemap: false,
  },
  watch: {
    clearScreen: false,
  },
  external: [],

  plugins: [
    /** Resolve bare module imports */
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    replace({
      'process.env.NODE_ENV': '"production"',
    }),
    copy({
      targets: [{ src: 'icon.png', dest: 'dist' }],
    }),
    typescript(),
    commonjs({}),
    /** Minify JS */
    terser(),
    /** Compile JS to a lower language target */
    babel({
      exclude: /node_modules/,

      babelHelpers: 'bundled',
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: [
              'last 3 Chrome major versions',
              'last 3 Firefox major versions',
              'last 3 Edge major versions',
              'last 3 Safari major versions',
            ],
            modules: false,
            bugfixes: true,
          },
        ],
      ],
      plugins: [],
    }),
    visualizer(),
  ],
};
