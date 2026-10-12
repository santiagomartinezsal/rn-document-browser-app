import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ViewMode } from './ViewModeToggle';
import { ViewModeToggle } from './ViewModeToggle';

function renderToggle(selected: ViewMode, onChange: (viewMode: ViewMode) => void) {
  return render(<ViewModeToggle selected={selected} onChange={onChange} />);
}

describe('ViewModeToggle', () => {
  it('renders both the list and grid segments', async () => {
    await renderToggle('list', jest.fn());

    expect(screen.getByTestId('view-mode-button-list')).toBeOnTheScreen();
    expect(screen.getByTestId('view-mode-button-grid')).toBeOnTheScreen();
  });

  it('calls onChange with "grid" when the grid segment is pressed', async () => {
    const onChange = jest.fn();
    await renderToggle('list', onChange);

    await fireEvent.press(screen.getByTestId('view-mode-button-grid'));

    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with "list" when the list segment is pressed', async () => {
    const onChange = jest.fn();
    await renderToggle('grid', onChange);

    await fireEvent.press(screen.getByTestId('view-mode-button-list'));

    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('marks the selected segment as accessibility-selected', async () => {
    await renderToggle('grid', jest.fn());

    expect(screen.getByTestId('view-mode-button-grid').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('view-mode-button-list').props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
