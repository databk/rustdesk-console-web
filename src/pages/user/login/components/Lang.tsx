import { SelectLang } from '@umijs/max';
import React from 'react';
import { useStyles } from '../styles';

const Lang = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

export default Lang;