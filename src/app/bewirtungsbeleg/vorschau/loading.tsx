import { Container, Center, Loader, Stack, Text } from '@mantine/core';

export default function Loading() {
  return (
    <Container size="lg" py="xl">
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text>Wird geladen...</Text>
        </Stack>
      </Center>
    </Container>
  );
}
