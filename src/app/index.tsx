import * as React from 'react';
import styles from './index.scss';

export function App(): JSX.Element {
  return (
    <div id={'app'}>
      <p className={styles.myClass}>Hello, Lewin!</p>
      <p>当前版本为{__NPM_VERSION__}</p>
    </div>
  );
}
