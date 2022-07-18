// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const ATFBackedBy = () => {
  return (
    <div className="space-y-2">
      <p className="uppercase text-white font-semibold">Backed By</p>
      <div className="flex items-center">
        <a
          href="https://techstars.com"
          target="_blank"
          rel="noopener noreferrer">
          <img
            src="/images/partners_logo_techstars.svg"
            alt="Techstars"
            loading="lazy"
            width="175px"
          />
        </a>
      </div>
    </div>
  );
};

export const ATFTrustedBy = () => {
  return (
    <div className="space-y-2">
      <p className="uppercase text-white font-semibold">Trusted By</p>
      <div className="flex items-center">
        <a
          href="https://vitalimages.com"
          target="_blank"
          rel="noopener noreferrer">
          <img
            src="/images/customers_logo_canon.svg"
            alt="Canon Medical Informatics"
            loading="lazy"
            width="120px"
          />
        </a>
      </div>
    </div>
  );
};
