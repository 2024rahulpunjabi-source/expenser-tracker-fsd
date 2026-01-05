import {useForm } from "react-hook-form"
import { CustomInput } from "../../components/Custominput";
import { CustomButton } from "../../components/CustomButton"
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {api} from "../../config/axios"
import { setCookie } from "../../utils/utils";
import { LONG_LIVE_TOKEN } from "../../constant/constants";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const Login = () => {

    const LoginForm = z.object({
            email: z.email(),
            password: z.string().nonempty("passowrd is Required").min(8, "Password should atleast have 8 char"),
        })
            const navigate = useNavigate();

        const {register, handleSubmit, formState: {errors}} = useForm({
            resolver:zodResolver(LoginForm)
        });
    
            console.log(errors);

    const onSubmit = async (data) => {
        const postObj = {
            email: data.email,
            password: data.password,
        }
        try {
            const response = await api({
                method: "POST",
                data: postObj,
                url: "/login"
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
            if(err.response && err.response.status == 400) {
                toast.error(err.response.data.data)
            }
        }
        
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
                                            <img src="null" alt="" width="50"/>
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
                                      
                                    </form>
                                    <p className="mt-3 mb-0 undefined">Don't have an account?
                                      
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
