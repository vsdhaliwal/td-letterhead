import { Router, type IRouter } from "express";
import healthRouter from "./health";
import letterheadRouter from "./letterhead";

const router: IRouter = Router();

router.use(healthRouter);
router.use(letterheadRouter);

export default router;
