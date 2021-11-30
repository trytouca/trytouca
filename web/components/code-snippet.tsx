// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  cpp,
  java,
  python,
  typescript
} from 'react-syntax-highlighter/dist/cjs/languages/hljs';
import { nightOwl } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);

export default function CodeSnippet(props: {
  input: { code: string; language: string };
}) {
  const languages: [string, string][] = [
    ['cpp', 'C++'],
    ['java', 'Java'],
    ['python', 'Python'],
    ['typescript', 'JavaScript']
  ];
  const language = languages.find((v) => v[1] == props.input.language);
  const slug = language ? language[0] : 'cpp';
  const customStyling = {
    backgroundColor: 'transparent',
    color: 'white',
    padding: '0.5rem'
  };
  return (
    <div className="w-full p-2 text-sm md:text-base md:p-4 xl:p-6 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 rounded-xl">
      <SyntaxHighlighter
        language={slug}
        style={nightOwl}
        customStyle={customStyling}
        wrapLongLines={true}>
        {props.input.code}
      </SyntaxHighlighter>
    </div>
  );
}
