// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { ErrorMessage, Field, Form, Formik, FormikProps } from 'formik';
import React from 'react';
import * as Yup from 'yup';

import { extract_error, Feedback, post_json } from '@/lib/api';
import { tracker } from '@/lib/tracker';

const SignupForm = () => (
  <Formik
    initialValues={{ umail: '' }}
    onSubmit={async (values, { setStatus, setSubmitting }) => {
      const response = await post_json('auth/signup', { email: values.umail });
      if (response.status === 201) {
        setSubmitting(false);
        setStatus({
          type: 'success',
          message: 'Check your inbox to complete your account registration.'
        });
      } else {
        setStatus({
          type: 'error',
          message: await extract_error(response, [
            [400, 'email is invalid', 'Your email address appears invalid.'],
            [
              400,
              'email already registered',
              'There is already an account associated with this email address.'
            ],
            [
              403,
              'email address suspicious',
              'Please use an email address with a different domain.'
            ]
          ])
        });
      }
      tracker.track({ action: 'sign_up' });
    }}
    validationSchema={Yup.object({
      umail: Yup.string()
        .email('Please use a valid email address')
        .required('This field is required')
    })}
    validateOnChange={false}
    validateOnBlur={true}>
    {(props: FormikProps<{ umail: string }>) => (
      <Form noValidate={true}>
        <label className="sr-only" htmlFor="umail">
          Email Address
        </label>
        <div className="flex h-10 space-x-2">
          <Field
            className="flex-grow rounded-md border border-gray-300 bg-white text-black shadow-md focus:border-gray-500 focus:outline-none focus:ring-0"
            type="email"
            id="umail"
            name="umail"
            placeholder="Email address"
          />
          <button
            className="overflow-hidden rounded-md border border-transparent bg-green-600 px-4 font-semibold text-white shadow-md duration-150 ease-in-out hover:bg-green-700 focus:border-gray-200 focus:outline-none focus:ring-0"
            type="submit">
            <span className="hidden lg:block">Signup for Free</span>
            <span className="lg:hidden">Sign up</span>
          </button>
        </div>
        <ErrorMessage name="umail">
          {(msg) => <Feedback message={msg} type="warning"></Feedback>}
        </ErrorMessage>
        {props.isValid && props.status && (
          <Feedback
            message={props.status.message}
            type={props.status.type}></Feedback>
        )}
        <p className="mt-2 text-white">
          You can explore Touca in action using the test results in our
          playground.
        </p>
        <span className="text-green-400"></span>
        <span className="text-yellow-400"></span>
        <span className="text-red-400"></span>
      </Form>
    )}
  </Formik>
);

export default SignupForm;
