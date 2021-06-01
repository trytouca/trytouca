/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ErrorMessage, Field, Form, Formik, FormikProps } from 'formik';
import React from 'react';
import * as Yup from 'yup';

import { extract_error, Feedback, post_json } from '@/lib/api';
import { event as gtag_event } from '@/lib/gtag';

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
      gtag_event({ action: 'sign_up' });
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
            className="flex-grow text-black bg-white border border-gray-300 rounded-md shadow-md focus:outline-none focus:border-gray-500 focus:ring-0"
            type="email"
            id="umail"
            name="umail"
            placeholder="Email address"
          />
          <button
            className="px-4 overflow-hidden border border-transparent rounded-md wsl-btn-green"
            type="submit">
            Signup for Free
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
