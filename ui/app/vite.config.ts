import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const components = [
  'dialog',
  'dropdown',
  'menu',
  'menu-item',
  'checkbox',
  'divider',
  'menu-label',
  'option',
  'select',
  'tooltip',
  'card',
  'icon-button',
  'button',
  'icon',
  'alert',
  'input',
  'spinner',
  'avatar',
  'skeleton',
];
const exclude = components.map(
  c => `@shoelace-style/shoelace/dist/components/${c}/${c}.js`
);
export default defineConfig({
  optimizeDeps: {
    exclude: [
      ...exclude,
      '@holochain-open-dev/elements/elements/display-error.js',
    ],
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint --ext .ts,.html src',
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(
            __dirname,
            '../../node_modules/@shoelace-style/shoelace/dist/assets'
          ),
          dest: path.resolve(__dirname, 'dist/shoelace'),
        },
      ],
    }),
  ],
});
