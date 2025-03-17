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
          width={120}
          height={30}
          fit="contain"
        />
      </Stack>
      <BewirtungsbelegForm />
    </Container>
  );
} 