import { Checkbox, Select } from 'antd';
import type { ReactNode } from 'react';
import styles from './CheckboxMultiSelect.module.css';

export type MultiSelectValue = string | number;

export interface CheckboxMultiSelectOption<Value extends MultiSelectValue> {
  value: Value;
  label: ReactNode;
  disabled?: boolean;
}

interface CheckboxMultiSelectProps<Value extends MultiSelectValue> {
  allOptionLabel?: ReactNode;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (values: Value[]) => void;
  options: Array<CheckboxMultiSelectOption<Value>>;
  placeholder?: ReactNode;
  showSearch?: boolean;
  value?: Value[];
}

/**
 * Shared multi-value select with explicit checkbox affordances.
 *
 * This component is intentionally only for fields where selecting multiple
 * values is valid. Single-entity business fields (customer, warehouse,
 * product on an order line, etc.) stay single-select to preserve domain rules.
 */
export function CheckboxMultiSelect<Value extends MultiSelectValue>({
  allOptionLabel,
  ariaLabel,
  className,
  disabled,
  onChange = () => undefined,
  options,
  placeholder,
  showSearch = false,
  value = [],
}: CheckboxMultiSelectProps<Value>) {
  const selectedValues = new Set<Value>(value);
  const enabledValues = options
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const selectedEnabledCount = enabledValues
    .filter((optionValue) => selectedValues.has(optionValue))
    .length;
  const allSelected = Boolean(allOptionLabel)
    ? value.length === 0
    : enabledValues.length > 0 && selectedEnabledCount === enabledValues.length;
  const someSelected = Boolean(allOptionLabel)
    ? value.length > 0
    : selectedEnabledCount > 0 && !allSelected;

  return (
    <Select<Value[]>
      allowClear
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      maxTagCount="responsive"
      menuItemSelectedIcon={null}
      mode="multiple"
      optionFilterProp="label"
      options={options}
      dropdownRender={(menu) => (
        <>
          {allOptionLabel ? (
            <button
              type="button"
              className={styles.allOption}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange([])}
            >
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                className={styles.checkbox}
                tabIndex={-1}
              />
              <span className={styles.optionLabel}>{allOptionLabel}</span>
            </button>
          ) : null}
          {menu}
        </>
      )}
      placeholder={placeholder}
      showSearch={showSearch}
      value={value}
      onChange={onChange}
      optionRender={(option) => (
        <div className={styles.optionRow}>
          <Checkbox
            checked={selectedValues.has(option.value as Value)}
            className={styles.checkbox}
            tabIndex={-1}
          />
          <span className={styles.optionLabel}>{option.label}</span>
        </div>
      )}
    />
  );
}
