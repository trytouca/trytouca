/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import Head from 'next/head';

import ContactForm from '@/components/contact-form';
import FooterCta from '@/components/footer-cta';

interface PageContent {
  title: string;
  subtitle: string;
}

const content: PageContent = {
  title: 'Contact Us',
  subtitle: 'Let us know how we can help.'
};

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Weasel - Contact Us</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="p-4 text-center space-y-2">
            <h2 className="text-white text-4xl font-extrabold">
              {content.title}
            </h2>
            <p className="text-white text-xl">{content.subtitle}</p>
          </div>
          <section className="p-4 min-h-[25vh] flex items-center">
            <div className="p-8 mx-auto w-full max-w-lg bg-white rounded-xl">
              <ContactForm></ContactForm>
            </div>
          </section>
        </div>
      </section>
      <section className="py-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
