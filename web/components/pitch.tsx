export default function OneLinerPitch() {
  return (
    <section className="flex items-center wsl-min-h-screen-3 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900">
      <div className="container mx-auto">
        <div className="max-w-5xl px-8 mx-auto text-white">
          <p className="py-4 text-3xl text-left lg:text-4xl">
            It takes{' '}
            <span className="font-medium text-yellow-500">23 days</span> for
            software engineers to gain confidence that a given code change works
            as they expect.
          </p>
          <p className="py-4 text-2xl text-right">
            Touca reduces this to{' '}
            <span className="text-yellow-500">minutes</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
