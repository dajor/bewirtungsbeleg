'use client';

import { Container, Image, Stack } from '@mantine/core';
import BewirtungsbelegForm from '../components/BewirtungsbelegForm';

export default function BewirtungsbelegPage() {
  return (
    <Container size="lg" py="xl">
      <Stack align="center" mb="xl">
        <Image
          src="/docbits.svg"
          alt="DocBits Logo"
          width={200}
          height={50}
          fit="contain"
          style={{ maxWidth: '200px', height: '50px' }}
        />
      </Stack>
      <BewirtungsbelegForm />
    </Container>
  );
}