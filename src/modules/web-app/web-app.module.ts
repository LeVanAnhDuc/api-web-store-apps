// others
import {
  MongoWebAppRepository,
  MongoWebAppCategoryRepository
} from "./repositories";
import { WebAppService } from "./web-app.service";
import { WebAppController } from "./web-app.controller";
import {
  createAdminWebAppRoutes,
  createUserWebAppRoutes
} from "./web-app.routes";

export const createWebAppModule = () => {
  const webAppRepo = new MongoWebAppRepository();
  const categoryRepo = new MongoWebAppCategoryRepository();
  const service = new WebAppService(webAppRepo, categoryRepo);
  const controller = new WebAppController(service);

  return {
    webAppAdminRouter: createAdminWebAppRoutes(controller),
    webAppUserRouter: createUserWebAppRoutes(controller)
  };
};
