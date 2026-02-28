import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Paapeli UI Kit',
    // Served via staticDirs from apps/web/src/assets/
    brandImage: '/paapeli-logo-new.png',
    brandTarget: '_self',

    // Brand colors from the design system
    colorPrimary: '#ff7900',   // brand-500
    colorSecondary: '#aa4f00', // brand-700
  }),
});
