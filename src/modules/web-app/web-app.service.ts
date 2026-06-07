// types
import type { AdminAppsQuery } from "./types";
import type {
  WebAppRepository,
  WebAppCategoryRepository
} from "./repositories";
import type { AdminAppDto, AdminCategoryDto } from "./dtos";
// dtos
import { toAdminAppDto, toAdminCategoryDto } from "./dtos";
// others
import { buildWebAppFilter } from "./helpers";

export class WebAppService {
  constructor(
    private readonly webAppRepo: WebAppRepository,
    private readonly categoryRepo: WebAppCategoryRepository
  ) {}

  async listApps(query: AdminAppsQuery): Promise<{ items: AdminAppDto[] }> {
    const filter = buildWebAppFilter(query);
    const docs = await this.webAppRepo.findAll(filter);
    return { items: docs.map(toAdminAppDto) };
  }

  async listCategories(): Promise<AdminCategoryDto[]> {
    const docs = await this.categoryRepo.findAll();
    return docs.map(toAdminCategoryDto);
  }
}
