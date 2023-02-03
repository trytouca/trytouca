// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from "react";
import styles from "./since.module.css";

export default function Since({ version }): JSX.Element {
  return (
    <div className={styles.since}>
      <div>Since: {version}</div>
    </div>
  );
}
