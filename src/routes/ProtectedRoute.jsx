import { LONG_LIVE_TOKEN } from "../constant/constants"
import { getCookie } from "../utils/utils"
import { Navigate } from "react-router-dom";





export const ProtectedRoute = ({component}) => {
    const token = getCookie(LONG_LIVE_TOKEN);
    if (!token) {
        return <Navigate to={"/login"}/>
    }
    return component;
}