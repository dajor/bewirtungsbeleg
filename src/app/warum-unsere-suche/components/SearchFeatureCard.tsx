import { Card, Stack, Text, Badge, List, ThemeIcon, Box } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

interface SearchFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  color: string;
  comingSoon?: boolean;
}

export default function SearchFeatureCard({
  icon,
  title,
  subtitle,
  description,
  benefits,
  color,
  comingSoon = false,
}: SearchFeatureCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
      <Stack gap="md">
        {/* Icon and Title */}
        <Box style={{ color: `var(--mantine-color-${color}-6)` }}>
          {icon}
        </Box>

        <Stack gap="xs">
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Text fw={700} size="xl">
              {title}
            </Text>
            {comingSoon ? (
              <Badge color="violet" variant="light" size="sm">
                {subtitle}
              </Badge>
            ) : (
              <Badge color="green" variant="light" size="sm">
                {subtitle}
              </Badge>
            )}
          </Box>

          <Text c="dimmed" size="sm">
            {description}
          </Text>
        </Stack>

        {/* Benefits List */}
        <List
          spacing="xs"
          size="sm"
          center
          icon={
            <ThemeIcon color={color} size={20} radius="xl">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {benefits.map((benefit, index) => (
            <List.Item key={index}>{benefit}</List.Item>
          ))}
        </List>
      </Stack>
    </Card>
  );
}
