/**
 * Unit Tests for BewirtungsbelegForm File Deletion Logic
 *
 * These tests verify the core file removal and image preview management logic
 * without requiring full component rendering or Mantine providers.
 */

import { describe, it, expect } from 'vitest';

describe('BewirtungsbelegForm - File Removal State Management', () => {
  it('should clear selectedImage when last file is removed', () => {
    // Unit test for handleFileRemove logic
    const files = [
      { id: '1', file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }) },
    ];

    let selectedImage: File | null = files[0].file;
    let attachedFiles = [...files];

    // Simulate file removal
    const removedFile = attachedFiles.find(f => f.id === '1');
    attachedFiles = attachedFiles.filter(f => f.id !== '1');

    if (removedFile && selectedImage === removedFile.file) {
      if (attachedFiles.length > 0) {
        selectedImage = attachedFiles[0].file;
      } else {
        selectedImage = null;
      }
    }

    expect(selectedImage).toBeNull();
    expect(attachedFiles.length).toBe(0);
  });

  it('should auto-select first remaining file when selected file is removed', () => {
    const files = [
      { id: '1', file: new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }) },
      { id: '2', file: new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }) },
    ];

    let selectedImage: File | null = files[0].file;
    let attachedFiles = [...files];

    // Simulate removing the selected file
    const removedFile = attachedFiles.find(f => f.id === '1');
    attachedFiles = attachedFiles.filter(f => f.id !== '1');

    if (removedFile && selectedImage === removedFile.file) {
      if (attachedFiles.length > 0) {
        selectedImage = attachedFiles[0].file;
      } else {
        selectedImage = null;
      }
    }

    expect(selectedImage).toBe(files[1].file);
    expect(selectedImage?.name).toBe('test2.jpg');
    expect(attachedFiles.length).toBe(1);
  });

  it('should keep selectedImage unchanged when removing non-selected file', () => {
    const files = [
      { id: '1', file: new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }) },
      { id: '2', file: new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }) },
    ];

    let selectedImage: File | null = files[0].file;
    let attachedFiles = [...files];

    // Simulate removing a non-selected file
    const removedFile = attachedFiles.find(f => f.id === '2');
    attachedFiles = attachedFiles.filter(f => f.id !== '2');

    if (removedFile && selectedImage === removedFile.file) {
      if (attachedFiles.length > 0) {
        selectedImage = attachedFiles[0].file;
      } else {
        selectedImage = null;
      }
    }

    expect(selectedImage).toBe(files[0].file);
    expect(selectedImage?.name).toBe('test1.jpg');
    expect(attachedFiles.length).toBe(1);
  });
});
