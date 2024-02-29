import { useContext, useEffect, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  CHECK_REPEATED_USER,
  REGISTER_USER,
  LOGIN_USER,
} from "../../queries/user";
import { LoggedInScreen } from "./main";
import { UserContext } from "../../App";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function SignUp() {
  const [currScreen, setCurrScreen] = useState("email-password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState("");
  const { currentUser, setCurrentUser } = useContext(UserContext);

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
        <PassswordEmailInput
          setEmail={setEmail}
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
        />
      )}
    </div>
  );
}

function SignedUpScreen({ email, password, user, setCurrentUser }) {
  const [loginFunction, { data, loading, error }] = useMutation(LOGIN_USER, {
    update(cache, { data }) {
      console.log(data);
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

  if (redirectVisual) {
    return <Navigate to={`/visuals/${redirectVisual}`} />;
  }

  return (
    <div className="align-text-center">
      <p>Successfully signed up as {user}</p>
      <Link className="btn btn-link link-primary" to="/visuals">
        Explore visuals
      </Link>
    </div>
  );
}

export function PassswordEmailInput({ setEmail, setPassword, setCurrScreen }) {
  const [errorState, setErrorState] = useState({ error: true, message: "" });
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordInput, setPasswordInput] = useState();
  const [emailInput, setEmailInput] = useState();
  const [confirmPasswordInput, setConfirmPasswordInput] = useState();

  const [checkRepeatedUser, { data, error }] = useLazyQuery(
    CHECK_REPEATED_USER,
    {
      onCompleted: (data) => {
        setErrorState({
          error: data?.usersCount > 0,
          message: data?.usersCount > 0 ? "Email is already registered" : "",
        });
      },
    }
  );
  function checkUserOrEmail(input) {
    checkRepeatedUser({ variables: input });
    if (errorState?.message == "Invalid email address") {
      checkValidEmail(input.email);
    }
  }

  function checkValidEmail(input) {
    if (errorState?.message === "Email is already registered") {
      return;
    }
    const isValidEmail = validateEmail(input);
    setErrorState({
      error: !isValidEmail,
      message: isValidEmail ? "" : "Invalid email address",
    });
  }

  function checkValidPassword(input) {
    setPasswordInput(input);
    const isValidPass = validateEmail(input);
    setErrorState({
      error: !isValidPass,
      message: isValidPass
        ? ""
        : "Password must be 8 characters with a number and capital letter.",
    });
  }

  function checkPasswordsMatch(e) {
    if (e.target.value !== passwordInput) {
      setErrorState({ error: true, message: "Passwords do not match" });
    } else {
      setErrorState({ error: false, message: "" });
    }
  }

  useEffect(() => {
    if (
      passwordInput &&
      emailInput &&
      confirmPasswordInput &&
      !errorState.error
    ) {
      setIsFormValid(true);
      console.log("Valid!");
    } else {
      setIsFormValid(false);
      console.log("Invalid!");
    }
  }, [passwordInput, emailInput, confirmPasswordInput, errorState]);

  if (error) return <span>Error</span>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isFormValid) {
          setEmail(emailInput);
          setPassword(passwordInput);
          setCurrScreen("username");
        }
      }}
    >
      <div className="mb-3">
        <label htmlFor="inputEmail">Email</label>
        <input
          type="email"
          className="form-control"
          id="inputEmail"
          onChange={(e) => {
            checkUserOrEmail({ email: e.target.value });
            setEmailInput(e.target.value);
          }}
          onBlur={(e) => checkValidEmail(e.target.value)}
          autoComplete="email"
        ></input>
      </div>
      <div className="mb-3">
        <label htmlFor="inputPassword">Password</label>
        <input
          type="password"
          className="form-control"
          id="inputPassword"
          onChange={(e) => checkValidPassword(e.target.value)}
          autoComplete="new-password"
        ></input>
      </div>
      <div className="mb-3">
        <label htmlFor="confirmInputPassword">Confirm your password</label>
        <input
          type="password"
          className="form-control"
          id="confirmInputPassword"
          onChange={(e) => {
            setConfirmPasswordInput(e.target.value);
            checkPasswordsMatch(e);
          }}
          autoComplete="new-password"
        ></input>
      </div>
      {errorState?.error && (
        <p className="text-warning">{errorState?.message}</p>
      )}
      <button
        type="submit"
        className={`btn btn-primary ${!isFormValid && "disabled"}`}
      >
        Submit
      </button>
    </form>
  );
}

function UserSignUp({ email, password, setUser, setCurrScreen }) {
  const [userInput, setUserInput] = useState();
  const [errorState, setErrorState] = useState({});

  const [signupFunction, { loading }] = useMutation(REGISTER_USER);

  const [checkRepeatedUser] = useLazyQuery(CHECK_REPEATED_USER, {
    onCompleted: (data) => {
      setErrorState({
        error: data?.usersCount > 0,
        message: data?.usersCount > 0 ? "Username is already taken" : "",
      });
    },
  });

  function checkInputValid(input) {
    setUserInput(input);
    if (input != "" && validateUsername(input)) {
      checkRepeatedUser({ variables: { name: input } });
      setErrorState({ error: false, message: "" });
    } else {
      setErrorState({
        error: true,
        message: "Username must not contain any spaces or special characters",
      });
    }
  }

  function submitCallback(e) {
    e.preventDefault();
    if (!loading) {
      signupFunction({
        variables: {
          data: { email, password, name: userInput },
        },
      });
      setCurrScreen("signed-up");
      setUser(userInput);
    }
  }

  return (
    <form onSubmit={submitCallback}>
      <div className="mb-3">
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
      {errorState?.error && (
        <p className="text-warning">{errorState?.message}</p>
      )}
      <button
        type="submit"
        className={`btn btn-primary ${errorState?.error && "disabled"}`}
      >
        Submit
      </button>
    </form>
  );
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

  // Explanation of the regex:
  // ^               Start of string
  // (?=.*[a-z])     At least one lowercase letter
  // (?=.*[A-Z])     At least one uppercase letter
  // (?=.*\d)        At least one digit
  // {8,}$           At least 8 digit-length

  return regex.test(password);
}

function validateUsername(username) {
  // Regular expression to allow only alphanumeric characters and underscores
  const regex = /^[a-zA-Z0-9_]+$/;
  return regex.test(username);
}
