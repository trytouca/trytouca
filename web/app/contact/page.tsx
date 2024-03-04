// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import React from 'react';

import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  alternates: { canonical: '/contact' }
};

export default function Page() {
  return (
    <section className="bg-dark-blue-900">
      <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
        <div className="space-y-2 p-4 text-center">
          <h2 className="text-4xl font-extrabold text-white">Contact Us</h2>
          <p className="text-xl text-white">Let us know how we can help.</p>
        </div>
        <section className="flex min-h-[25vh] items-center p-4">
          <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8">
            <ContactForm />
          </div>
        </section>
      </div>
    </section>
  );
}
