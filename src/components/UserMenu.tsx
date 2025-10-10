'use client';

import {
  Menu,
  Avatar,
  Group,
  Text,
  UnstyledButton,
  rem,
  useMantineTheme,
  Box,
} from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconReceipt,
  IconChevronDown,
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export function UserMenu() {
  const theme = useMantineTheme();
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);

  if (!session?.user) return null;

  const user = session.user;
  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || '?';

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: 'pop-top-right' }}
      onClose={() => setOpened(false)}
      onOpen={() => setOpened(true)}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          style={{
            padding: rem(8),
            borderRadius: theme.radius.sm,
            transition: 'background-color 150ms ease',
            backgroundColor: opened ? theme.colors.gray[0] : 'transparent',
            '&:hover': {
              backgroundColor: theme.colors.gray[0],
            },
          }}
        >
          <Group gap={rem(8)}>
            <Avatar color="blue" radius="xl" size="sm">
              {initials}
            </Avatar>
            <Box style={{ flex: 1 }} visibleFrom="sm">
              <Text size="sm" fw={500} lineClamp={1}>
                {user.name || 'Benutzer'}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {user.email}
              </Text>
            </Box>
            <IconChevronDown
              size={16}
              stroke={1.5}
              style={{
                transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {/* User Info Header */}
        <Menu.Label>
          <Group gap="xs">
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {user.name || 'Benutzer'}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {user.email}
              </Text>
            </div>
          </Group>
        </Menu.Label>

        <Menu.Divider />

        {/* Menu Items */}
        <Menu.Item
          component={Link}
          href="/profile"
          leftSection={<IconUser size={16} stroke={1.5} />}
        >
          Mein Profil
        </Menu.Item>

        <Menu.Item
          component={Link}
          href="/bewirtungsbeleg"
          leftSection={<IconReceipt size={16} stroke={1.5} />}
        >
          Meine Belege
        </Menu.Item>

        <Menu.Item
          component={Link}
          href="/settings"
          leftSection={<IconSettings size={16} stroke={1.5} />}
        >
          Einstellungen
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Abmelden
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
