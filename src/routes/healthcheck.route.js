import  router  from 'express';
import { healthcheck } from "../controllers/healthcheck.controller.js"

const healthcheckRouter = router();

healthcheckRouter.route('/').get(healthcheck);

export default healthcheckRouter;