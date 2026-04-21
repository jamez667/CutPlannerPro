import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Dimension } from '../enums/Dimension';
import { formatDimensionValue } from '../utils/formatters';
import { convertToMetric } from '../utils/unitConversion';

interface PresetDimensionDropdownProps {
  value: number | null;
  onChange: (event: React.SyntheticEvent, value: number | string | null) => void;
  options: number[];
  dimension: Dimension;
  units: string;
  label: string;
  required?: boolean;
  fullWidth?: boolean;
}

const PresetDimensionDropdown: React.FC<PresetDimensionDropdownProps> = ({
  value,
  onChange,
  options,
  dimension,
  units,
  label,
  required = false,
  fullWidth = false
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
          onChange={(e) => {onChange(e, convertToMetric(Number(e.target.value), units))}}
          label={`${label} (${units})`}
          type="number"
          required={required}
          fullWidth={fullWidth}
        />
      )}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      fullWidth={fullWidth}
    />
  );
};

export default PresetDimensionDropdown;