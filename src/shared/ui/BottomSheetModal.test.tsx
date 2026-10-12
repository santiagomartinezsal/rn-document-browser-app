import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BottomSheetModal } from './BottomSheetModal';

describe('BottomSheetModal', () => {
  it('does not render its title or children when not visible', async () => {
    await render(
      <BottomSheetModal
        visible={false}
        title="Sheet title"
        onClose={jest.fn()}
        closeButtonTestID="close-button"
      >
        <Text>Sheet content</Text>
      </BottomSheetModal>,
    );

    expect(screen.queryByText('Sheet title')).not.toBeOnTheScreen();
    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();
  });

  it('renders the title and children when visible', async () => {
    await render(
      <BottomSheetModal
        visible
        title="Sheet title"
        onClose={jest.fn()}
        closeButtonTestID="close-button"
      >
        <Text>Sheet content</Text>
      </BottomSheetModal>,
    );

    expect(screen.getByText('Sheet title')).toBeOnTheScreen();
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheetModal
        visible
        title="Sheet title"
        onClose={onClose}
        closeButtonTestID="close-button"
      >
        <Text>Sheet content</Text>
      </BottomSheetModal>,
    );

    await fireEvent.press(screen.getByTestId('close-button'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the overlay is pressed outside the sheet', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheetModal
        visible
        title="Sheet title"
        onClose={onClose}
        closeButtonTestID="close-button"
      >
        <Text>Sheet content</Text>
      </BottomSheetModal>,
    );

    await fireEvent.press(screen.getByTestId('close-button-overlay'));

    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when the sheet itself is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheetModal
        visible
        title="Sheet title"
        onClose={onClose}
        closeButtonTestID="close-button"
      >
        <Text>Sheet content</Text>
      </BottomSheetModal>,
    );

    await fireEvent.press(screen.getByTestId('close-button-sheet'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
