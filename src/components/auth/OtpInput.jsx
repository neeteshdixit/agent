import { useEffect, useMemo, useRef } from 'react';

const OTP_LENGTH = 6;

const buildDigits = (value) => {
  const cleaned = String(value ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
  return Array.from({ length: OTP_LENGTH }, (_, index) => cleaned[index] ?? '');
};

function OtpInput({ value, onChange, disabled = false, autoFocus = false }) {
  const inputRefs = useRef([]);
  const digits = useMemo(() => buildDigits(value), [value]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const firstEmptyIndex = digits.findIndex((digit) => digit === '');
    const indexToFocus = firstEmptyIndex === -1 ? OTP_LENGTH - 1 : firstEmptyIndex;
    inputRefs.current[indexToFocus]?.focus();
  }, [autoFocus, disabled, digits]);

  const updateValueAtIndex = (index, rawValue) => {
    const numericValue = rawValue.replace(/\D/g, '');
    if (!numericValue) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
      return;
    }

    const nextDigits = [...digits];
    const values = numericValue.slice(0, OTP_LENGTH - index).split('');
    values.forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    onChange(nextDigits.join(''));

    const focusIndex = Math.min(index + values.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text');
    onChange(pasted.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <div className="flex items-center gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={`otp-digit-${index}`}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateValueAtIndex(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-12 w-11 rounded-lg border border-zinc-700 bg-zinc-950 text-center text-lg font-semibold tracking-wider text-zinc-100 outline-none ring-brand-500 transition focus:border-brand-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
