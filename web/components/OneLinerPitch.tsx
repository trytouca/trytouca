// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

export default function OneLinerPitch() {
  return (
    <section className="flex items-center bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 py-36">
      <div className="container mx-auto">
        <div className="mx-auto max-w-5xl px-8 text-white">
          <p className="py-4 text-left text-3xl lg:text-4xl">
            It takes{' '}
            <span className="font-medium text-yellow-500">23 days</span> for
            software engineers to gain confidence that a given code change works
            as they expect.
          </p>
          <p className="py-4 text-right text-2xl">
            Touca reduces this to{' '}
            <span className="text-yellow-500">minutes</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
