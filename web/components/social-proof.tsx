// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const ATFBackedBy = () => {
  return (
    <a href="https://techstars.com" target="_blank" rel="noopener noreferrer">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-white sm:text-base">
          Backed By
        </p>
        <div className="flex items-center">
          <img
            src="/images/partners_logo_techstars.svg"
            alt="Techstars"
            loading="lazy"
            width="175px"
          />
        </div>
      </div>
    </a>
  );
};

export const ATFTrustedBy = () => {
  return (
    <a href="https://vitalimages.com" target="_blank" rel="noopener noreferrer">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-white sm:text-base">
          Trusted By
        </p>
        <div className="flex items-center">
          <img
            src="/images/customers_logo_canon.svg"
            alt="Canon Medical Informatics"
            loading="lazy"
            width="120px"
          />
        </div>
      </div>
    </a>
  );
};
