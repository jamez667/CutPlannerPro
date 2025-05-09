import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Dimension } from '../enums/Dimension';
import { formatDimensionValue } from '../utils/formatters';

interface PresetDimensionDropdownProps {
  value: number | null;
  onChange: (event: React.SyntheticEvent, value: number | string | null) => void;
  options: number[];
  dimension: Dimension;
  units: string;
  label: string;
  required?: boolean;
}

const PresetDimensionDropdown: React.FC<PresetDimensionDropdownProps> = ({
  value,
  onChange,
  options,
  dimension,
  units,
  label,
  required = false
}) => {
  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      options={options}
      getOptionLabel={(option) => option?.toString() || ''}
      renderOption={(props, option) => (
        <li {...props}>
          {formatDimensionValue(option, dimension, units)}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={`${label} (${units})`}
          type="number"
          required={required}
        />
      )}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
    />
  );
};

export default PresetDimensionDropdown;