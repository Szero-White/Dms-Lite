import type { ReactNode } from 'react';
import {
  CheckboxMultiSelect,
  type CheckboxMultiSelectOption,
  type MultiSelectValue,
} from '../CheckboxMultiSelect';

export type TableFilterValue = MultiSelectValue;
export type TableMultiSelectFilterOption<Value extends TableFilterValue> =
  CheckboxMultiSelectOption<Value>;

interface TableMultiSelectFilterProps<Value extends TableFilterValue> {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  onChange: (values: Value[]) => void;
  options: Array<TableMultiSelectFilterOption<Value>>;
  placeholder: ReactNode;
  showSearch?: boolean;
  value: Value[];
}

/**
 * Multi-value table filter.
 *
 * Empty selection is the canonical "all" state. Selecting every enabled
 * option collapses back to empty so filter state, clear behavior and URL/API
 * mapping remain deterministic across screens.
 */
export function TableMultiSelectFilter<Value extends TableFilterValue>({
  ariaLabel,
  className,
  disabled,
  onChange,
  options,
  placeholder,
  showSearch = false,
  value,
}: TableMultiSelectFilterProps<Value>) {
  return (
    <CheckboxMultiSelect
      allOptionLabel={placeholder}
      ariaLabel={ariaLabel}
      className={className}
      disabled={disabled}
      options={options}
      placeholder={placeholder}
      showSearch={showSearch}
      value={value}
      onChange={(nextValues) => {
        const enabledOptionCount = options.filter((option) => !option.disabled).length;
        const normalized = enabledOptionCount > 0 && nextValues.length === enabledOptionCount
          ? []
          : nextValues;

        onChange(normalized);
      }}
    />
  );
}
