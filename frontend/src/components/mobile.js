import React from "react";

export default function MobileUnavaiabilityScreen() {
  return (
    <div className="h-100 row align-items-center justify-content-center ms-2 me-2">
      <div className="text-center">
        <h3>Sorry! This site is only available on desktop devices.</h3>
        <p>
          To ensure the best user experience, it's not currently supported on
          small devices. For now, feel free to check out our{" "}
          <a
            className="link-underline link-underline-opacity-0"
            href="https://creative-quantified-self.gitbook.io/docs/"
          >
            documentation
          </a>{" "}
          and{" "}
          <a
            className="link-underline link-underline-opacity-0"
            href="https://github.com/esromerog/QuantifiedSelf"
          >
            repository.
          </a>
        </p>
      </div>
    </div>
  );
}
