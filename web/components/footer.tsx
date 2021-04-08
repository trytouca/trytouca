/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

const copyrightYear = new Date().getFullYear();

const social = [
  {
    title: 'Join our Community',
    link: 'https://getweasel.slack.com',
    icon: ['fab', 'slack']
  },
  {
    title: 'Follow us on Twitter',
    link: 'https://twitter.com/getweasel',
    icon: ['fab', 'twitter']
  },
  {
    title: 'Check us out on GitHub',
    link: 'https://github.com/getweasel',
    icon: ['fab', 'github']
  }
];

export default function Header() {
  return (
    <footer className="bg-gradient-to-r from-light-blue-800 to-light-blue-700 border-t border-light-blue-600">
      <div className="h-20 px-12 mx-auto container flex items-center justify-between">
        <p className="text-white text-sm">
          &copy; {copyrightYear} Weasel, Inc.
        </p>
        <ul className="flex space-x-4">
          {social.map((item) => {
            return (
              <li key={item.link} title={item.title}>
                <a href={item.link} target="_blank" rel="noopener">
                  {item.icon}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
