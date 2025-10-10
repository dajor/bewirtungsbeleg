'use client';

import {
  AppShell,
  Group,
  Button,
  Image,
  Container,
  Burger,
  Drawer,
  Stack,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserMenu } from './UserMenu';

export function Header() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navLinks = [
    { href: '/bewirtungsbeleg', label: 'Beleg erstellen' },
    { href: '/#features', label: 'Features' },
    { href: '/release-notes', label: 'Release Notes' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) || false;
  };

  return (
    <>
      <AppShell.Header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E9ECEF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Image
                src="/docbits.svg"
                alt="DocBits"
                height={32}
                width="auto"
                fit="contain"
                style={{ cursor: 'pointer' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <Group gap={rem(8)} visibleFrom="sm">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  variant={isActive(link.href) ? 'light' : 'subtle'}
                  color={isActive(link.href) ? 'blue' : 'gray'}
                  size="sm"
                >
                  {link.label}
                </Button>
              ))}
            </Group>

            {/* Desktop Auth Actions */}
            <Group gap={rem(12)} visibleFrom="sm">
              {status === 'loading' ? (
                <Button variant="subtle" loading>
                  Lädt...
                </Button>
              ) : session ? (
                <UserMenu />
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/auth/signin"
                    variant="subtle"
                    color="gray"
                    size="sm"
                  >
                    Anmelden
                  </Button>
                  <Button
                    component={Link}
                    href="/auth/register"
                    variant="filled"
                    color="blue"
                    size="sm"
                  >
                    Registrieren
                  </Button>
                </>
              )}
            </Group>

            {/* Mobile Menu Button */}
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="sm"
              size="sm"
            />
          </Group>
        </Container>
      </AppShell.Header>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Menü"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <Stack gap="md">
          {/* Mobile Navigation Links */}
          {navLinks.map((link) => (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              variant={isActive(link.href) ? 'light' : 'subtle'}
              color={isActive(link.href) ? 'blue' : 'gray'}
              fullWidth
              onClick={closeDrawer}
            >
              {link.label}
            </Button>
          ))}

          {/* Mobile Auth Actions */}
          {status === 'loading' ? (
            <Button variant="subtle" loading fullWidth>
              Lädt...
            </Button>
          ) : session ? (
            <Stack gap="sm">
              <Button
                component={Link}
                href="/profile"
                variant="light"
                fullWidth
                onClick={closeDrawer}
              >
                Mein Profil
              </Button>
              <Button
                component={Link}
                href="/settings"
                variant="subtle"
                fullWidth
                onClick={closeDrawer}
              >
                Einstellungen
              </Button>
              <Button
                variant="subtle"
                color="red"
                fullWidth
                onClick={() => {
                  closeDrawer();
                  // signOut will be implemented
                }}
              >
                Abmelden
              </Button>
            </Stack>
          ) : (
            <Stack gap="sm">
              <Button
                component={Link}
                href="/auth/signin"
                variant="light"
                fullWidth
                onClick={closeDrawer}
              >
                Anmelden
              </Button>
              <Button
                component={Link}
                href="/auth/register"
                variant="filled"
                color="blue"
                fullWidth
                onClick={closeDrawer}
              >
                Registrieren
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>
    </>
  );
}
