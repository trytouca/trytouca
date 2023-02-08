// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from "react";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import CodeBlock from "@theme/CodeBlock";

export default function InstallCommands(): JSX.Element {
  return (
    <Tabs
      values={[
        { label: "PIP", value: "pip" },
        { label: "Homebrew", value: "brew" }
      ]}
    >
      <TabItem value="pip">
        <CodeBlock language="bash">{`pip install touca`}</CodeBlock>
      </TabItem>
      <TabItem value="brew">
        <CodeBlock language="bash">
          {`brew tap trytouca/trytouca
brew install touca`}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
