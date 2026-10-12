import { fireEvent, render, screen } from '@testing-library/react-native';

import type { SortKey } from '../domain/sortDocuments';
import { SortMenu } from './SortMenu';

function renderSortMenu(selected: SortKey, onChange: (sortBy: SortKey) => void) {
  return render(<SortMenu selected={selected} onChange={onChange} />);
}

describe('SortMenu', () => {
  it('renders the "Sort by" trigger', async () => {
    await renderSortMenu('date', jest.fn());

    expect(screen.getByTestId('sort-menu-button')).toBeOnTheScreen();
  });

  it('shows all sort options after pressing the trigger', async () => {
    await renderSortMenu('date', jest.fn());

    await fireEvent.press(screen.getByTestId('sort-menu-button'));

    expect(screen.getByTestId('sort-menu-option-date')).toBeOnTheScreen();
    expect(screen.getByTestId('sort-menu-option-title')).toBeOnTheScreen();
    expect(screen.getByTestId('sort-menu-option-version')).toBeOnTheScreen();
  });

  it('calls onChange with the pressed option', async () => {
    const onChange = jest.fn();
    await renderSortMenu('date', onChange);

    await fireEvent.press(screen.getByTestId('sort-menu-button'));
    await fireEvent.press(screen.getByTestId('sort-menu-option-title'));

    expect(onChange).toHaveBeenCalledWith('title');
  });
});
