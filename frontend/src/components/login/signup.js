import { useContext, useEffect, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  CHECK_REPEATED_USER,
  REGISTER_USER,
  LOGIN_USER,
} from "../../queries/user";
import { LoggedInScreen } from "./main";
import { UserContext } from "../../App";
import { Link, Navigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { profanity } from "@2toad/profanity";

export default function SignUp() {
  const [currScreen, setCurrScreen] = useState("email-password");
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  if (currentUser && currScreen !== "signed-up") {
    return (
      <div className="login-div mt-5 align-text-center">
        <LoggedInScreen
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      </div>
    );
  }

  return (
    <div className="login-div mt-5">
      <div className="d-flex mb-4 align-items-center justify-content-between">
        <h5 className="fw-bold m-0 p-0">Sign up</h5>
        {currScreen !== "signed-up" && (
          <Link to="/login" className="btn btn-dark fw-medium">
            Log in instead
          </Link>
        )}
      </div>
      {currScreen === "email-password" && (
        <PasswordEmailInput
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          setCurrScreen={setCurrScreen}
        />
      )}
      {currScreen === "username" && (
        <UserSignUp
          email={email}
          password={password}
          setUser={setUser}
          setCurrScreen={setCurrScreen}
        />
      )}
      {currScreen === "signed-up" && (
        <SignedUpScreen
          email={email}
          password={password}
          user={user}
          setCurrentUser={setCurrentUser}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function SignedUpScreen({
  email,
  password,
  user,
  setCurrentUser,
  currentUser,
}) {
  const [loginFunction, { data, loading, error }] = useMutation(LOGIN_USER, {
    update(cache, { data }) {
      if (data?.authenticateUserWithPassword?.item) {
        setCurrentUser(data?.authenticateUserWithPassword?.item);
      }
    },
  });

  useEffect(() => {
    loginFunction({
      variables: {
        email,
        password,
      },
    });
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const redirectVisual = searchParams.get("visual");
  const redirectUser = searchParams.get("user");

  if (currentUser?.id) {
    if (redirectVisual) {
      return <Navigate to={`/visuals/${redirectVisual}`} />;
    }
    if (redirectUser) {
      return <Navigate to={`/user/${redirectUser}`} />;
    }
  }

  // Determine the redirect message before rendering.
  const redirectMessage = (() => {
    if (redirectVisual) return "Redirecting you to the last visual...";
    if (redirectUser) return "Redirecting you to the last user...";
    return null;
  })();

  return (
    <div className="align-text-center">
      <p>Successfully signed up as {user}</p>
      {redirectMessage ? (
        <p>{redirectMessage}</p>
      ) : (
        <Link className="btn btn-link link-primary" to="/visuals">
          Explore visuals
        </Link>
      )}
    </div>
  );
}

const SignupSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[@$!%*-?_&]/,
      "Password must contain at least one special character"
    ),
});

export function PasswordEmailInput({ setEmail, setPassword, setCurrScreen }) {
  const [checkRepeatedUser, { data, error }] =
    useLazyQuery(CHECK_REPEATED_USER);

  if (error) return <span>Error</span>;

  return (
    <Formik
      initialValues={{
        email: "",
        password: "",
      }}
      validationSchema={SignupSchema}
      onSubmit={async (values, { setErrors, setSubmitting }) => {
        // Run the check for repeated user
        const { data, error } = await checkRepeatedUser({
          variables: { email: values.email },
        });

        if (data?.usersCount > 0) {
          // If the email is already registered, show an error message
          setErrors({ email: "Email is already registered" });
          setSubmitting(false); // Stop the form submission process
        } else {
          // If email is not repeated, proceed to the next step
          setEmail(values.email);
          setPassword(values.password);
          setCurrScreen("username");
        }
      }}
      validateOnMount={true}
    >
      {({ errors }) => {
        return (
          <Form>
            <label htmlFor="email">Email</label>

            <Field name="email" type="email" className="form-control" />
            {errors.email ? (
              <div className="text-body-tertiary">{errors.email}</div>
            ) : null}
            <label htmlFor="password" className="mt-3">
              Password
            </label>

            <Field name="password" type="password" className="form-control" />
            {errors.password ? (
              <div className="text-body-tertiary">{errors.password}</div>
            ) : null}
            <button
              type="submit"
              className={`btn btn-primary mt-3 ${
                (errors?.password || errors?.email) && "disabled"
              }`}
            >
              Submit
            </button>
          </Form>
        );
      }}
    </Formik>
  );
}

function UserSignUp({ email, password, setUser, setCurrScreen }) {
  const [userInput, setUserInput] = useState();
  const [error, setError] = useState();

  const [signupFunction] = useMutation(REGISTER_USER);

  const [checkRepeatedUser] = useLazyQuery(CHECK_REPEATED_USER);

  function checkInputValid(input) {
    setUserInput(input);
    if (input != "" && validateUsername(input)) {
      setError();
    } else {
      setError("Username is invalid");
    }
  }

  async function submitCallback(e) {
    e.preventDefault();

    const { data } = await checkRepeatedUser({
      variables: { name: userInput },
    });

    if (data?.usersCount > 0) {
      setError("Username is already taken");
    } else {
      setUser(userInput);
      signupFunction({
        variables: {
          data: { email, password, name: userInput },
        },
      });
      setCurrScreen("signed-up");
    }
  }

  return (
    <form onSubmit={submitCallback}>
      <div>
        <label htmlFor="inputUser">Username</label>
        <input
          type="text"
          className="form-control"
          id="inputUser"
          onChange={(e) => {
            checkInputValid(e.target.value);
          }}
        ></input>
      </div>
      {error && <p className="text-body-tertiary">{error}</p>}
      <button
        type="submit"
        className={`btn btn-primary mt-3 ${error && "disabled"}`}
      >
        Submit
      </button>
    </form>
  );
}

export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (
    username.length > 3 &&
    username.length < 18 &&
    usernameRegex.test(username) &&
    !profanity.exists(username)
  ) {
    return true;
  } else {
    return false;
  }
}
