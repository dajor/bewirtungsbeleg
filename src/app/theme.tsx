import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  components: {
    Input: {
      styles: (theme) => ({
        input: {
          '&:focus': {
            borderColor: theme.colors.blue[6],
          },
        },
      }),
    },
    Button: {
      styles: (theme) => ({
        root: {
          fontWeight: 500,
        },
      }),
    },
  },
}); 