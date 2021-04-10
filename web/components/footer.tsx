/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

const social = [
  {
    link: 'https://github.com/getweasel',
    title: 'Check us out on GitHub',
    text: 'GitHub'
  },
  {
    link: 'https://twitter.com/getweasel',
    title: 'Follow us on Twitter',
    text: 'Twitter'
  },
  {
    link: 'https://getweasel.com/contact',
    title: 'Get in Touch',
    text: 'Contact'
  },
  {
    link: 'https://docs.getweasel.com/legal/terms',
    title: 'Terms of Service',
    text: 'Terms'
  }
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-dark-blue-800 via-dark-blue-800 to-dark-blue-900 border-t border-dark-blue-800">
      <div className="h-20 px-12 mx-auto container flex items-center justify-between">
        <p className="text-white text-sm font-semibold">&copy; Weasel, Inc.</p>
        <ul className="flex space-x-6">
          {social.map((item) => {
            return (
              <li key={item.link} title={item.title}>
                <a href={item.link} target="_blank" rel="noopener">
                  <p className="text-gray-200 hover:text-white text-sm font-semibold">
                    {item.text}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
