'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  TextInput,
  Group,
  Button,
  Paper,
  Grid,
  Card,
  Badge,
  Loader,
  Center,
  Pagination,
  Select,
  ActionIcon,
  Menu,
  Box,
  Image,
  Divider,
  rem,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconGrid3x3,
  IconList,
  IconFileDescription,
  IconCalendar,
  IconDownload,
  IconEye,
  IconTrash,
  IconDots,
  IconCheck,
  IconAlertCircle,
  IconClock,
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { Document, DocumentListResponse, DocumentStatus, DocumentType } from '@/types/document';

export default function MeineBelegePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<DocumentType | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);

      const response = await fetch(`/api/documents/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Dokumente');
      }

      const data: DocumentListResponse = await response.json();
      setDocuments(data.documents);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, typeFilter, statusFilter, dateFromFilter, dateToFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments();
    }
  }, [status, fetchDocuments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, statusFilter, dateFromFilter, dateToFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format amount
  const formatAmount = (amount: number | undefined, currency: string = 'EUR') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'error':
        return 'red';
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Get status label
  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen';
      case 'processing':
        return 'In Bearbeitung';
      case 'error':
        return 'Fehler';
      case 'pending':
        return 'Ausstehend';
      default:
        return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return <IconCheck size={14} />;
      case 'processing':
        return <IconClock size={14} />;
      case 'error':
        return <IconAlertCircle size={14} />;
      default:
        return null;
    }
  };

  // Get document type label
  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'bewirtungsbeleg':
        return 'Bewirtungsbeleg';
      case 'eigenbeleg':
        return 'Eigenbeleg';
      case 'receipt':
        return 'Quittung';
      case 'invoice':
        return 'Rechnung';
      default:
        return type;
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Meine Belege
          </Title>
          <Text c="dimmed" size="sm">
            Alle Ihre Bewirtungsbelege und Dokumente
          </Text>
        </div>

        {/* Search Bar - Prominent at Top */}
        <Paper shadow="sm" p="md" radius="md">
          <Stack gap="md">
            <TextInput
              placeholder="Dokumente durchsuchen (OpenSearch: Volltext & Vektor)"
              leftSection={<IconSearch size={20} />}
              size="lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              rightSection={
                searchQuery && (
                  <ActionIcon
                    variant="transparent"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </ActionIcon>
                )
              }
            />

            {/* Filters Row */}
            <Group justify="space-between">
              <Group gap="sm">
                <Select
                  placeholder="Dokumenttyp"
                  data={[
                    { value: 'bewirtungsbeleg', label: 'Bewirtungsbeleg' },
                    { value: 'eigenbeleg', label: 'Eigenbeleg' },
                    { value: 'receipt', label: 'Quittung' },
                    { value: 'invoice', label: 'Rechnung' },
                  ]}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as DocumentType)}
                  clearable
                  leftSection={<IconFileDescription size={16} />}
                  style={{ width: rem(200) }}
                />

                <Select
                  placeholder="Status"
                  data={[
                    { value: 'completed', label: 'Abgeschlossen' },
                    { value: 'processing', label: 'In Bearbeitung' },
                    { value: 'error', label: 'Fehler' },
                    { value: 'pending', label: 'Ausstehend' },
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as DocumentStatus)}
                  clearable
                  leftSection={<IconFilter size={16} />}
                  style={{ width: rem(180) }}
                />

                <Button
                  variant="light"
                  leftSection={<IconCalendar size={16} />}
                  onClick={() => {
                    // TODO: Implement date range picker
                    console.log('Open date range picker');
                  }}
                >
                  Datumsbereich
                </Button>
              </Group>

              {/* View Toggle */}
              <Group gap="xs">
                <ActionIcon
                  variant={viewMode === 'grid' ? 'filled' : 'light'}
                  onClick={() => setViewMode('grid')}
                  size="lg"
                >
                  <IconGrid3x3 size={20} />
                </ActionIcon>
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'light'}
                  onClick={() => setViewMode('list')}
                  size="lg"
                >
                  <IconList size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Error State */}
        {error && (
          <Alert color="red" title="Fehler" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Center py={60}>
            <Loader size="lg" />
          </Center>
        )}

        {/* Empty State */}
        {!isLoading && documents.length === 0 && (
          <Paper shadow="sm" p="xl" radius="md">
            <Stack align="center" gap="md" py={40}>
              <IconFileDescription size={64} stroke={1} color="gray" />
              <div>
                <Text size="lg" fw={500} ta="center">
                  Keine Dokumente gefunden
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {searchQuery || typeFilter || statusFilter
                    ? 'Versuchen Sie, Ihre Suchkriterien anzupassen'
                    : 'Erstellen Sie Ihren ersten Bewirtungsbeleg'}
                </Text>
              </div>
              {!searchQuery && !typeFilter && !statusFilter && (
                <Button
                  onClick={() => router.push('/bewirtungsbeleg')}
                  leftSection={<IconFileDescription size={16} />}
                >
                  Beleg erstellen
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {/* Document Grid View */}
        {!isLoading && documents.length > 0 && viewMode === 'grid' && (
          <Grid gutter="md">
            {documents.map((doc) => (
              <Grid.Col key={doc.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Box
                      style={{
                        height: rem(160),
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {doc.thumbnail_url ? (
                        <Image
                          src={doc.thumbnail_url}
                          alt={doc.name}
                          fit="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <IconFileDescription size={48} stroke={1} color="gray" />
                      )}
                    </Box>
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Group justify="space-between" wrap="nowrap">
                      <Badge
                        color={getStatusColor(doc.status)}
                        variant="light"
                        leftSection={getStatusIcon(doc.status)}
                      >
                        {getStatusLabel(doc.status)}
                      </Badge>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => doc.pdf_url && window.open(doc.pdf_url, '_blank')}
                            disabled={!doc.pdf_url}
                          >
                            Ansehen
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconDownload size={14} />}
                            onClick={() => {
                              if (doc.pdf_url) {
                                const link = document.createElement('a');
                                link.href = doc.pdf_url;
                                link.download = doc.name;
                                link.click();
                              }
                            }}
                            disabled={!doc.pdf_url}
                          >
                            Herunterladen
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => {
                              // TODO: Implement delete functionality
                              console.log('Delete document:', doc.id);
                            }}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <div>
                      <Text size="sm" fw={500} lineClamp={2} title={doc.name}>
                        {doc.metadata.restaurant_name || doc.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {getTypeLabel(doc.type)}
                      </Text>
                    </div>

                    <Divider />

                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Betrag
                        </Text>
                        <Text size="sm" fw={600}>
                          {formatAmount(doc.metadata.total_amount, doc.metadata.currency)}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed" ta="right">
                          Datum
                        </Text>
                        <Text size="sm">
                          {formatDate(doc.created_at)}
                        </Text>
                      </div>
                    </Group>

                    {doc.gobd_compliant && (
                      <Badge color="green" variant="light" fullWidth>
                        <IconCheck size={12} /> GoBD-konform
                      </Badge>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        {/* Document List View */}
        {!isLoading && documents.length > 0 && viewMode === 'list' && (
          <Stack gap="xs">
            {documents.map((doc) => (
              <Paper key={doc.id} shadow="sm" p="md" radius="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="md">
                    <Box
                      style={{
                        width: rem(60),
                        height: rem(60),
                        backgroundColor: '#f8f9fa',
                        borderRadius: rem(8),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {doc.thumbnail_url ? (
                        <Image
                          src={doc.thumbnail_url}
                          alt={doc.name}
                          fit="cover"
                          style={{ width: '100%', height: '100%', borderRadius: rem(8) }}
                        />
                      ) : (
                        <IconFileDescription size={32} stroke={1} color="gray" />
                      )}
                    </Box>

                    <div>
                      <Group gap="xs" mb={4}>
                        <Text size="sm" fw={500}>
                          {doc.metadata.restaurant_name || doc.name}
                        </Text>
                        <Badge
                          color={getStatusColor(doc.status)}
                          variant="light"
                          size="sm"
                          leftSection={getStatusIcon(doc.status)}
                        >
                          {getStatusLabel(doc.status)}
                        </Badge>
                        {doc.gobd_compliant && (
                          <Badge color="green" variant="light" size="sm">
                            <IconCheck size={10} /> GoBD
                          </Badge>
                        )}
                      </Group>
                      <Group gap="md">
                        <Text size="xs" c="dimmed">
                          {getTypeLabel(doc.type)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(doc.created_at)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {doc.metadata.business_purpose}
                        </Text>
                      </Group>
                    </div>
                  </Group>

                  <Group gap="md">
                    <div style={{ textAlign: 'right' }}>
                      <Text size="xs" c="dimmed">
                        Betrag
                      </Text>
                      <Text size="sm" fw={600}>
                        {formatAmount(doc.metadata.total_amount, doc.metadata.currency)}
                      </Text>
                    </div>

                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={() => doc.pdf_url && window.open(doc.pdf_url, '_blank')}
                          disabled={!doc.pdf_url}
                        >
                          Ansehen
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconDownload size={14} />}
                          onClick={() => {
                            if (doc.pdf_url) {
                              const link = document.createElement('a');
                              link.href = doc.pdf_url;
                              link.download = doc.name;
                              link.click();
                            }
                          }}
                          disabled={!doc.pdf_url}
                        >
                          Herunterladen
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            // TODO: Implement delete functionality
                            console.log('Delete document:', doc.id);
                          }}
                        >
                          Löschen
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {!isLoading && documents.length > 0 && totalPages > 1 && (
          <Center>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="lg"
            />
          </Center>
        )}
      </Stack>
    </Container>
  );
}
