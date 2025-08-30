import { register } from "./register.ts";
import { login } from "./login.ts";
import { logout } from "./logout.ts";


const authController = {
    register,
    login,
    logout,
};

export { authController };