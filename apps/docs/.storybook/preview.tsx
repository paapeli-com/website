import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
// Compiles the SCSS design system and injects .bg-* / .text-* utilities
import '@paapeli/ui-kit/styles';
// Docs-specific CSS custom properties (dark/light page chrome)
import '../src/globals.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        Light: '',
        Dark: 'dark',
      },
      defaultTheme: 'Light',
    }),
  ],
  parameters: {
    // Let the story control its own background via .bg-* classes
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
