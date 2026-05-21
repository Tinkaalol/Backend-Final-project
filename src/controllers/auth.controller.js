import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(['ADMIN', 'MANAGER', 'STOREKEEPER']).default('STOREKEEPER'),
  tenantId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export const register = [
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user,
    });
  }),
];

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ code: 'MISSING_TOKEN', message: 'Token is required' });
  const result = await authService.verifyEmail(token);
  res.status(200).json(result);
});

export const login = [
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  }),
];

export const refresh = [
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.status(200).json(result);
  }),
];

export const logout = [
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    await authService.logoutUser(req.body.refreshToken, accessToken);
    res.status(204).send();
  }),
];

export const forgotPassword = [
  validateBody(forgotSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json(result);
  }),
];

export const resetPassword = [
  validateBody(resetSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json(result);
  }),
];

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});
