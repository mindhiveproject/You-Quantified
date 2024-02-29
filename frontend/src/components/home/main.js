import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div className="container">
            <div className="row text-center">
                <h1>You: Quantified</h1>
            </div>
            <div className="row">
                <Link className="col btn btn-primary rounded-0 m-5" to="/devices">Get Started</Link>
                <Link className="col btn btn-outline-primary rounded-0 m-5" to="/login">Login</Link>
            </div>
        </div>
    )
}