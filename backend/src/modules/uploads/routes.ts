import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as ctrl from "./controller.js";

const r = Router();

r.post("/signature", authenticate, ctrl.sign);
r.post("/confirm", authenticate, ctrl.confirm);
r.delete("/*", authenticate, ctrl.destroy);

export default r;
