// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import { ErrorMessage, Field, Form, Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import { extract_error, post_json } from '@/components/utils/api';
import { tracker } from '@/components/utils/tracker';

export default function ContactForm() {
  return (
    <Formik
      initialValues={{ body: '', name: '', email: '', cname: '' }}
      onSubmit={async (values, { setStatus, setSubmitting, resetForm }) => {
        const response = await post_json('feedback', {
          page: 'contact-us',
          ...values
        });
        if (response.status === 204) {
          resetForm({});
          setSubmitting(false);
          setStatus({
            type: 'success',
            message: 'Thank you. We will get back to you shortly.'
          });
        } else {
          setSubmitting(false);
          setStatus({
            type: 'error',
            message: await extract_error(response, [
              [400, 'email is invalid', 'Your email address appears invalid.']
            ])
          });
        }
        tracker.track({ action: 'contact_us' });
      }}
      validationSchema={Yup.object({
        body: Yup.string()
          .min(20, 'Please provide more information')
          .max(1000, 'Must be less than 1000 characters')
          .required('This field is required'),
        name: Yup.string()
          .max(100, 'Must be less than 100 characters')
          .required('This field is required'),
        email: Yup.string()
          .email('Please use a valid email address')
          .max(100, 'Must be less than 100 characters')
          .required('This field is required'),
        cname: Yup.string()
          .max(100, 'Must be less than 100 characters')
          .required('This field is required')
      })}
      validateOnChange={false}
      validateOnBlur={true}>
      {(
        props: FormikProps<{
          body: string;
          name: string;
          email: string;
          cname: string;
        }>
      ) => (
        <Form className="space-y-4" noValidate={true}>
          <div className="flex w-full flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="name">
              Full Name<span className="text-indigo-500">*</span>
            </label>
            <Field
              className="rounded-md border border-gray-300 bg-white text-black focus:border-indigo-300 focus:outline-none focus:ring-0"
              type="text"
              name="name"
              id="name"
            />
            <ErrorMessage name="name">
              {(msg) => <small className="text-red-600">{msg}</small>}
            </ErrorMessage>
          </div>
          <div className="flex w-full flex-col space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="email">
              Email Address<span className="text-indigo-500">*</span>
            </label>
            <Field
              className="rounded-md border border-gray-300 bg-white text-black focus:border-indigo-300 focus:outline-none focus:ring-0"
              type="email"
              name="email"
              id="email"
            />
            <ErrorMessage name="email">
              {(msg) => <small className="text-red-600">{msg}</small>}
            </ErrorMessage>
          </div>
          <div className="flex w-full flex-col space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="cname">
              Company Name<span className="text-indigo-500">*</span>
            </label>
            <Field
              className="rounded-md border border-gray-300 bg-white text-black focus:border-indigo-300 focus:outline-none focus:ring-0"
              type="text"
              name="cname"
              id="cname"
            />
            <ErrorMessage name="cname">
              {(msg) => <small className="text-red-600">{msg}</small>}
            </ErrorMessage>
          </div>
          <div className="flex w-full flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="body">
              How can we help?<span className="text-indigo-500">*</span>
            </label>
            <Field
              className="rounded-md border border-gray-300 bg-white text-black focus:border-indigo-300 focus:outline-none focus:ring-0"
              as="textarea"
              name="body"
              id="body"
              rows={3}
              maxLength={5000}
            />
            <ErrorMessage name="body">
              {(msg) => <small className="text-red-600">{msg}</small>}
            </ErrorMessage>
          </div>
          <div className="flex items-center justify-between">
            <button
              className="overflow-hidden rounded-md bg-sky-800 px-4 py-2 font-medium text-white shadow-md duration-150 ease-in-out hover:bg-sky-900 focus:border-gray-200 focus:outline-none focus:ring-0"
              type="submit">
              Submit
            </button>
            {props.isValid && props.status && (
              <small
                className={
                  props.status.type === 'success'
                    ? 'font-medium text-green-600'
                    : 'text-red-600'
                }>
                {props.status.message}
              </small>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
