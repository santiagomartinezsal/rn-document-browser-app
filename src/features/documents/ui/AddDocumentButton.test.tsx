import { fireEvent, render, screen } from '@testing-library/react-native';

import { AddDocumentButton } from './AddDocumentButton';

describe('AddDocumentButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<AddDocumentButton onPress={onPress} />);

    await fireEvent.press(screen.getByTestId('add-document-button'));

    expect(onPress).toHaveBeenCalled();
  });
});
