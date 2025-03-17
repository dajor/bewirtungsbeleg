import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  components: {
    Input: {
      styles: {
        input: {
          '&:focus': {
            borderColor: 'var(--mantine-color-blue-6)',
          },
        },
      },
    },
    Button: {
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
}); 