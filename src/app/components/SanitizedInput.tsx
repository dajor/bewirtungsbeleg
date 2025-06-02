import React, { useCallback } from 'react';
import { TextInput, Textarea, NumberInput, type TextInputProps, type TextareaProps } from '@mantine/core';
import { sanitizeInput } from '@/lib/validation';

interface SanitizedTextInputProps extends Omit<TextInputProps, 'onChange'> {
  onChange?: (value: string) => void;
  onChangeEvent?: TextInputProps['onChange'];
}

export function SanitizedTextInput({ onChange, onChangeEvent, ...props }: SanitizedTextInputProps) {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(event.currentTarget.value);
    if (onChange) {
      onChange(sanitized);
    }
    if (onChangeEvent) {
      // Create a new event with sanitized value
      const newEvent = {
        ...event,
        currentTarget: {
          ...event.currentTarget,
          value: sanitized,
        },
        target: {
          ...event.target,
          value: sanitized,
        },
      };
      onChangeEvent(newEvent as React.ChangeEvent<HTMLInputElement>);
    }
  }, [onChange, onChangeEvent]);

  return <TextInput {...props} onChange={handleChange} />;
}

interface SanitizedTextareaProps extends Omit<TextareaProps, 'onChange'> {
  onChange?: (value: string) => void;
  onChangeEvent?: TextareaProps['onChange'];
}

export function SanitizedTextarea({ onChange, onChangeEvent, ...props }: SanitizedTextareaProps) {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitized = sanitizeInput(event.currentTarget.value);
    if (onChange) {
      onChange(sanitized);
    }
    if (onChangeEvent) {
      // Create a new event with sanitized value
      const newEvent = {
        ...event,
        currentTarget: {
          ...event.currentTarget,
          value: sanitized,
        },
        target: {
          ...event.target,
          value: sanitized,
        },
      };
      onChangeEvent(newEvent as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [onChange, onChangeEvent]);

  return <Textarea {...props} onChange={handleChange} />;
}

// For number inputs with German decimal format
interface GermanNumberInputProps extends Omit<TextInputProps, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  allowNegative?: boolean;
}

export function GermanNumberInput({ 
  value = '', 
  onChange, 
  allowNegative = false,
  ...props 
}: GermanNumberInputProps) {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = event.currentTarget.value;
    
    // Allow only numbers, comma, and optionally minus
    const pattern = allowNegative ? /[^0-9,-]/g : /[^0-9,]/g;
    inputValue = inputValue.replace(pattern, '');
    
    // Ensure only one comma
    const parts = inputValue.split(',');
    if (parts.length > 2) {
      inputValue = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      inputValue = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    if (onChange) {
      onChange(inputValue);
    }
  }, [onChange, allowNegative]);

  return (
    <TextInput
      {...props}
      value={value}
      onChange={handleChange}
      placeholder="0,00"
    />
  );
}