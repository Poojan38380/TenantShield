import { Request, Response } from 'express';
import { ApiResponse } from "../../types/api.js";

export const logout = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please remove the token from client storage.',
    } as ApiResponse);
  };
  