// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

export const TrustedBy = () => {
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
