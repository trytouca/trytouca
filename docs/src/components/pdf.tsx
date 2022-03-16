import React from "react";
import { FiFile } from "react-icons/fi";
import styles from "./pdf.module.css";

export default function PDF(props: {
  input: { link: string; filename: string; caption: string };
}): JSX.Element {
  return (
    <div className={styles.pdfCard}>
      <div className={styles.pdfIcon}>
        <FiFile size="1.5rem" />
      </div>
      <div>
        <a className={styles.pdfTitle} href={props.input.link}>
          {props.input.filename}
        </a>
        <div className={styles.pdfSubtitle}>PDF</div>
      </div>
    </div>
  );
}
