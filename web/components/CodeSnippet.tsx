// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import cpp from 'react-syntax-highlighter/dist/cjs/languages/hljs/cpp';
import java from 'react-syntax-highlighter/dist/cjs/languages/hljs/java';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript';
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
    <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-2 text-sm md:p-4 md:text-base xl:p-6">
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
