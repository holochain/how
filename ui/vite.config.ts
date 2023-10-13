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
   // disabled: true,
    exclude: [
      ...exclude,
      '@holochain-open-dev/elements/elements/display-error.js',
      '@holochain-open-dev/elements/dist/elements/holo-identicon.js',
      '@holochain-open-dev/profiles/dist/elements/dist/agent-avatar.js',
    ],
  },
  plugins: [
    checker({
      typescript: true,
      // eslint: {
      //   lintCommand: 'eslint --ext .ts,.html src',
      // },
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
