'use client';

import { Button, Menu, Text, Avatar } from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { useSession, signOut } from 'next-auth/react';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const initials = session.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button variant="subtle" p="xs">
          <Avatar size="sm" color="blue" radius="xl" mr="xs">
            {initials}
          </Avatar>
          <Text size="sm">{session.user.name}</Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Konto</Menu.Label>
        <Menu.Item leftSection={<IconUser size={14} />} disabled>
          <div>
            <Text size="sm">{session.user.name}</Text>
            <Text size="xs" c="dimmed">
              {session.user.email}
            </Text>
            <Text size="xs" c="dimmed">
              Rolle: {session.user.role}
            </Text>
          </div>
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          Abmelden
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}