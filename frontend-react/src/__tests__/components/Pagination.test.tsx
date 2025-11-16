import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils';
import { Pagination } from '../../components/common/Pagination';

describe('Pagination', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = vi.fn();
  });

  it('should render pagination with correct page count', () => {
    render(<Pagination page={1} totalPages={5} onChange={mockOnChange} />);

    // Should render pagination buttons
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should not render when totalPages is 1 or less', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={mockOnChange} />);

    expect(container.firstChild).toBeNull();
  });

  it('should call onChange when page button is clicked', async () => {
    const user = userEvent.setup();

    render(<Pagination page={1} totalPages={5} onChange={mockOnChange} />);

    const page2Button = screen.getByRole('button', { name: 'Go to page 2' });
    await user.click(page2Button);

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should scroll to top when page changes', async () => {
    const user = userEvent.setup();

    render(<Pagination page={1} totalPages={5} onChange={mockOnChange} />);

    const page2Button = screen.getByRole('button', { name: 'Go to page 2' });
    await user.click(page2Button);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should render first and last buttons', () => {
    render(<Pagination page={3} totalPages={10} onChange={mockOnChange} />);

    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to last page' })).toBeInTheDocument();
  });

  it('should highlight the current page', () => {
    render(<Pagination page={3} totalPages={5} onChange={mockOnChange} />);

    const currentPageButton = screen.getByRole('button', { name: 'page 3' });
    expect(currentPageButton).toHaveClass('Mui-selected');
  });

  it('should call onChange with first page when first button is clicked', async () => {
    const user = userEvent.setup();

    render(<Pagination page={5} totalPages={10} onChange={mockOnChange} />);

    const firstButton = screen.getByRole('button', { name: 'Go to first page' });
    await user.click(firstButton);

    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  it('should call onChange with last page when last button is clicked', async () => {
    const user = userEvent.setup();

    render(<Pagination page={1} totalPages={10} onChange={mockOnChange} />);

    const lastButton = screen.getByRole('button', { name: 'Go to last page' });
    await user.click(lastButton);

    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  it('should disable previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onChange={mockOnChange} />);

    const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onChange={mockOnChange} />);

    const nextButton = screen.getByRole('button', { name: 'Go to next page' });
    expect(nextButton).toBeDisabled();
  });
});
