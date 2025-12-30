export const Login = () => {
    return (
        <div className="authincation">
            <div className="container">
                <div className="row justify-content-center align-items-center g-0">
                    <div className="col-xl-8">
                        <div className="row g-0">
                            <div className="col-lg-6">
                                <div className="welcome-content">
                                    <div className="welcome-title">
                                        <div className="mini-logo">
                                            <img src="" alt="" width="50"/>
                                        </div>
                                        <h3>Welcome to Expense Tracker</h3>
                                    </div>
                                    <div className="privacy-social">
                                        <div className="text-white">
                                            Your spending at a glance
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="auth-form shadow">
                                    <h4>Sign In</h4>
                                    <form action="">
                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <label className="form-label">Email</label>
                                                <input name="Email" type="text" className="form-control"/>
                                            </div>
                                            <div className="col-12 mb-3">
                                                <label className="form-label">Password</label>
                                                <input name="Password" type="text" className="form-control"/>
                                            </div>
                                        </div>
                                        <div className="mt-3 d-grid gap-2">
                                            <button type="submit"
                                                    className="btn btn-primary me-8 text-white">Sign In
                                            </button>
                                        </div>
                                    </form>
                                    <p className="mt-3 mb-0 undefined">Don't have an account?
                                        <a className="text-primary" href="">
                                            Sign up
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
