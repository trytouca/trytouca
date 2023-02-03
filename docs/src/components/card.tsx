// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React, { PropsWithChildren } from "react";
import { IconType } from "react-icons";
import { FiFile } from "react-icons/fi";
import styles from "./card.module.css";

const TwoColumnLayout = ({ children }: PropsWithChildren) => (
  <div className={styles.twoColumnLayout}>{children}</div>
);

const FourColumnLayout = ({ children }: PropsWithChildren) => (
  <div className={styles.fourColumnLayout}>{children}</div>
);

export default function Card(props: {
  label: string;
  children: string;
  icon?: IconType;
  href: string;
}): JSX.Element {
  const Icon = props.icon ?? FiFile;
  return (
    <a className={styles.cardContainer} href={props.href}>
      <div className={styles.cardIcon}>
        <Icon size="1.5rem" />
      </div>
      <div>
        <div className={styles.cardTitle}>{props.label}</div>
        <div className={styles.cardContent}>{props.children}</div>
      </div>
    </a>
  );
}

Card.TwoColumnLayout = TwoColumnLayout;
Card.FourColumnLayout = FourColumnLayout;
