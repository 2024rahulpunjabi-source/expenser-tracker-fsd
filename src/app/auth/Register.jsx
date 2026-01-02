import {useForm } from "react-hook-form"
import { CustomInput } from "../../components/CustomInput"
import { CustomButton } from "../../components/CustomButton"
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
const Register = () => {

    const RegisterForm = z.object({
        firstName: z.string().nonempty("First Name is required").min(2, "First name should atleast have 2 characters"),
        lastName: z.string().nonempty("Last Name is required").min(2, "Last name should atleast have 2 characters"),
        email: z.email(),
        phone: z.string().nonempty("Phone Number is required").length(10, "Phone Number should have 10 digits"),
        password: z.string().nonempty("password should not be empty").min(8, "password should have atleast 8 characters"),
    })
    

    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver:zodResolver(RegisterForm)
    })

    const onSubmit = (data) => {
        console.log(data)
    };

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
                                            {/*<a><img src={logoWhite} alt="" width="30"/></a>*/}
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
                                    <h4>Sign Up</h4>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <CustomInput label={"First Name"}
                                                             type={"text"}
                                                             name={"firstName"}
                                                             register={register}
                                                             error={errors.firstName}
                                                />
                                                </div>

                                                <div className="col-md-6">
                                                <CustomInput label={"Last Name"}
                                                             type={"text"}
                                                             name={"lastName"}
                                                             register={register}
                                                             error={errors.lastName}
                                                />
                                                </div>
                                                
                                               <CustomInput label={"Email"}
                                                             type={"text"}
                                                             name={"email"}
                                                             register={register}
                                                             error={errors.email}
                                                />

                                                <CustomInput label={"Phone"}
                                                             type={"number"}
                                                             name={"phone"}
                                                             register={register}
                                                             error={errors.phone}
                                                />
                                                 <CustomInput label={"Password"}
                                                             type={"text"}
                                                             name={"password"}
                                                             register={register}
                                                             error={errors.password}
                                                />
                                                <CustomButton label={"Register"}/>

                                         </div>   
                                        
                                    </form>
                                    <p className="mt-3 mb-0 undefined">Already have an account?
                                        <span className="text-primary"> Sign In</span>
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

export default Register