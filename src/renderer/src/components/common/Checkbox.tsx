import React from 'react'

/**
 * Properties for the Checkbox component.
 */
interface CheckboxProps {
  /** Optional label text to display next to the checkbox. */
  label?: string
  /** Whether the checkbox is currently checked. */
  checked: boolean
  /** Callback function triggered when the checked state changes. */
  onChange: (checked: boolean) => void
  /** Whether the checkbox is disabled and non-interactive. */
  disabled?: boolean
  /** Additional CSS class name for the container. */
  className?: string
}

/**
 * A reusable Checkbox component following the Neo-Brutalism design system.
 * Characterized by thick borders, sharp shadows, and high contrast.
 *
 * @param props The component properties.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  /**
   * Handles the native change event of the hidden input.
   * @param e The change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.checked)
  }

  return (
    <label
      className={`brutalist-checkbox-container ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        fontWeight: 700,
        fontSize: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '24px',
          height: '24px',
          flexShrink: 0
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            cursor: 'inherit',
            height: 0,
            width: 0
          }}
        />
        <div
          className="brutalist-checkbox-box"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '24px',
            width: '24px',
            backgroundColor: checked ? 'var(--secondary-color, #4dc274)' : 'var(--panel-bg, #fff)',
            border: 'var(--border-width, 4px) solid var(--border-color, #000)',
            boxShadow: checked ? 'none' : '2px 2px 0 var(--border-color, #000)',
            transform: checked ? 'translate(2px, 2px)' : 'none',
            transition: 'all 0.1s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {checked && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="square"
              strokeLinejoin="miter"
              style={{
                width: '16px',
                height: '16px',
                color: '#000'
              }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
      {label && <span>{label}</span>}

      <style>{`
        .brutalist-checkbox-container:hover .brutalist-checkbox-box {
          background-color: ${checked ? 'var(--secondary-color, #4dc274)' : 'var(--bg-color, #fdf5e6)'};
        }
        .brutalist-checkbox-container.disabled {
          opacity: 0.5;
        }
      `}</style>
    </label>
  )
}
