import React from "react";
import Image from "@theme/IdealImage";
import { useColorMode } from "@docusaurus/theme-common";

type Props = { src: string; dark?: string; alt?: string; title?: string };

export default function ToucaImage(props: Props) {
  const { colorMode } = useColorMode();
  const imagePath = colorMode === "dark" && props.dark ? props.dark : props.src;
  return (
    <Image
      img={require(`/img/assets/${imagePath}`)}
      alt={props.alt}
      title={props.title}
    />
  );
}
