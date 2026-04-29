import React from 'react';
import { Text, View } from 'react-native';

import { mergeClassNames } from '../utils';

type FormControlProps = React.ComponentPropsWithRef<typeof View> & { className?: string };

function FormControl({ ref, className, ...props }: FormControlProps) {
  return <View ref={ref} className={mergeClassNames('flex flex-col', className)} {...props} />;
}

type FormControlLabelProps = React.ComponentPropsWithRef<typeof View> & { className?: string };

function FormControlLabel({ ref, className, ...props }: FormControlLabelProps) {
  return (
    <View
      ref={ref}
      className={mergeClassNames('mb-1 flex-row items-center', className)}
      {...props}
    />
  );
}

type FormControlLabelTextProps = React.ComponentPropsWithRef<typeof Text> & { className?: string };

function FormControlLabelText({ ref, className, ...props }: FormControlLabelTextProps) {
  return (
    <Text
      ref={ref}
      className={mergeClassNames('text-base font-medium text-text-primary', className)}
      {...props}
    />
  );
}

FormControl.displayName = 'FormControl';
FormControlLabel.displayName = 'FormControlLabel';
FormControlLabelText.displayName = 'FormControlLabelText';

export { FormControl, FormControlLabel, FormControlLabelText };
