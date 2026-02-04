import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../../helpers/fileUploader";

import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { userValidation } from "./user.validation";
import checkAuth from "../../middlewares/checkAuth";

const router = express.Router();

router.get(
  "/",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.getAllFromDB,
);

router.get(
  "/me",
  checkAuth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  ),
  UserController.getMyProfile,
);

router.post(
  "/create-admin",
  checkAuth(UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data));
    return UserController.createAdmin(req, res, next);
  },
);

router.post(
  "/create-doctor",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createDoctor.parse(JSON.parse(req.body.data));
    return UserController.createDoctor(req, res, next);
  },
);

router.post(
  "/create-patient",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createPatient.parse(JSON.parse(req.body.data));
    return UserController.createPatient(req, res, next);
  },
);

router.patch(
  "/:id/status",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(userValidation.updateStatus),
  UserController.changeProfileStatus,
);

// router.patch(
//     "/update-my-profile",
//     checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
//     fileUploader.upload.single('file'),
//     (req: Request, res: Response, next: NextFunction) => {
//         req.body = JSON.parse(req.body.data)
//         return UserController.updateMyProfie(req, res, next)
//     }
// );

router.patch(
  "/update-my-profile",
  checkAuth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  ),
  fileUploader.upload.single("file"),
  (
    req: Request & { user?: { role: UserRole } },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = JSON.parse(req.body.data);
      // console.log("parsed", parsed);
      // Start with parsed payload
      const normalized: any = { ...parsed };
      // console.log("normalized", normalized);
      // Only normalize doctor-specific fields if role is DOCTOR
      if (req.user?.role === UserRole.DOCTOR) {
        if (parsed.appointmentFee !== undefined)
          normalized.appointmentFee = Number(parsed.appointmentFee);
        if (parsed.experience !== undefined)
          normalized.experience = Number(parsed.experience);
      }

      // Attach normalized payload to req.body
      req.body = normalized;
      // console.log("req body", req.body);
      return UserController.updateMyProfie(req, res, next);
    } catch (err) {
      next(err); // handle JSON.parse errors or any unexpected issues
    }
  },
);

export const userRoutes = router;
