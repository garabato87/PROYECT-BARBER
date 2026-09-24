/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminReportes from './SuperAdminReportes';
import * as firestore from 'firebase/firestore';

// Mock Firebase dependencies
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual as any,
    collection: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock('../services/firebase', () => ({
  db: {},
}));

// Mock Layout to simplify DOM
vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

describe('SuperAdminReportes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(firestore.onSnapshot).mockImplementation(() => vi.fn());

    render(
      <MemoryRouter>
        <SuperAdminReportes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('reportes-loading')).toBeInTheDocument();
  });

  it('renders stats after loading', async () => {
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      callback({ docs: [] });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminReportes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('reportes-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/total locales/i)).toBeInTheDocument();
  });
});
