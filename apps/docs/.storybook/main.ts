import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Serve the Paapeli logo from apps/web/src/assets at /
  // Path is resolved relative to .storybook/ directory
  staticDirs: [{ from: '../../web/src/assets', to: '/' }],
  docs: {
    autodocs: 'tag',
  },
};

export default config;
