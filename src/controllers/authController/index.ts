import { register } from "./register.js";
import { login } from "./login.js";
import { logout } from "./logout.js";


const authController = {
    register,
    login,
    logout,
};

export { authController };