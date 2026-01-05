import {useForm } from "react-hook-form"
import { CustomInput } from "../../components/Custominput";
import CustomButton from "../../components/CustomButton";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {api} from "../../config/axios"
import { errorHandler, setCookie } from "../../utils/utils";
import { LONG_LIVE_TOKEN } from "../../constant/constants";
import { useNavigate } from "react-router-dom";

const Register = () => {

    const RegisterForm = z.object({
        firstName: z.string().nonempty("First Name is required").min(2, "First name should atleast have 2 characters"),
        lastName: z.string().nonempty("Last Name is required").min(2, "Last name should atleast have 2 characters"),
        email: z.email(),
        phone: z.string().nonempty("Phone Number is required").length(10, "Phone Number should have 10 digits"),
        password: z.string().nonempty("password should not be empty").min(8, "password should have atleast 8 characters"),
    })
    const navigate = useNavigate();
    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver:zodResolver(RegisterForm)
    })

    const onSubmit = async (data) => {
        console.log(data)
        const postObj = {
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phone,
            email: data.email,
            password: data.password        
        }
        console.log(postObj)
        try {
            const response = await api({
                method: "POST",
                data: postObj,
                url: "/register"
            })
            if(response.status === 200) {
                console.log(response.data.data.token)
                //store token cookie
                setCookie(LONG_LIVE_TOKEN,response.data.data.token, 1)
                //navigate dashboard
                navigate("/")
            }
        }catch(err){
            //handle error
            errorHandler(err)
        }
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