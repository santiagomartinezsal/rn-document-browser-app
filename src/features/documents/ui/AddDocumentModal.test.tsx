import { fireEvent, render, screen } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';

import { AddDocumentModal } from './AddDocumentModal';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

async function renderModal() {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  await render(<AddDocumentModal visible onClose={onClose} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
}

describe('AddDocumentModal', () => {
  it('shows validation errors and does not submit when required fields are empty', async () => {
    const { onSubmit } = await renderModal();

    await fireEvent.press(screen.getByTestId('add-document-submit-button'));

    expect(screen.getByText('Name is required')).toBeOnTheScreen();
    expect(screen.getByText('Version must look like 1.0.0')).toBeOnTheScreen();
    expect(screen.getByText('Choose a file')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the filled-in input after a file is picked, then closes', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ name: 'manual.pdf', uri: 'file:///manual.pdf', lastModified: 0 }],
    });
    const { onSubmit, onClose } = await renderModal();

    await fireEvent.changeText(screen.getByTestId('add-document-title-input'), 'Hop Rod Rye');
    await fireEvent.changeText(screen.getByTestId('add-document-version-input'), '2.6.16');
    await fireEvent.press(screen.getByTestId('add-document-choose-file-button'));
    await screen.findByText('manual.pdf');
    await fireEvent.press(screen.getByTestId('add-document-submit-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Hop Rod Rye',
      version: '2.6.16',
      fileName: 'manual.pdf',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls DocumentPicker with copyToCacheDirectory disabled', async () => {
    jest
      .mocked(DocumentPicker.getDocumentAsync)
      .mockResolvedValue({ canceled: true, assets: null });
    await renderModal();

    await fireEvent.press(screen.getByTestId('add-document-choose-file-button'));

    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({ copyToCacheDirectory: false });
  });

  it('leaves the file unset when the picker is canceled', async () => {
    jest
      .mocked(DocumentPicker.getDocumentAsync)
      .mockResolvedValue({ canceled: true, assets: null });
    await renderModal();

    await fireEvent.press(screen.getByTestId('add-document-choose-file-button'));

    expect(screen.getByText('Choose file')).toBeOnTheScreen();
  });

  it('calls onClose when the close button is pressed', async () => {
    const { onClose } = await renderModal();

    await fireEvent.press(screen.getByTestId('add-document-close-button'));

    expect(onClose).toHaveBeenCalled();
  });
});
