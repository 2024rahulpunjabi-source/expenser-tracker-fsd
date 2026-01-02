import { useForm } from "react-hook-form"
import { CustomButton } from "../../components/CustomButton";
import { CustomInput } from "../../components/CustomInput";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const Login = () => {

    const LoginForm = z.object({
            email: z.email(),
            password: z.string().nonempty("passowrd is Required").min(8, "Password should atleast have 8 char"),
        })
        const {register, handleSubmit, formState: {errors}} = useForm({
            resolver:zodResolver(LoginForm)
        });
    
            console.log(errors);

    const onSubmit = (data) => {
        console.log(data);
        
    }
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
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="row">
                                           <CustomInput type={"text"}
                                                        label={"Email"}
                                                        name={"email"}
                                                        register={register}
                                                        error= {errors.email}
                                            />
                                            <CustomInput type={"password"}
                                                         label={"Password"}
                                                         name={"password"}
                                                         register={register}
                                                        error= {errors.password}
                                            />
                                        </div>
                                        <div className="row">
                                            <CustomButton label={"Sign in"} />
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
