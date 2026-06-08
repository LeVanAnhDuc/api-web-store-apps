// types
import type {
  AdminAppsQuery,
  AdminAppCreateBody,
  UserAppsQuery,
  PaginatedResult
} from "./types";
import type {
  WebAppRepository,
  WebAppCategoryRepository
} from "./repositories";
import type {
  AdminAppDto,
  AdminCategoryDto,
  AdminAppCreatedDto,
  UserAppDto
} from "./dtos";
// dtos
import {
  toAdminAppDto,
  toAdminCategoryDto,
  toAdminAppCreatedDto,
  toUserAppDto
} from "./dtos";
// others
import {
  buildWebAppFilter,
  toInternalStatus,
  generateClientId,
  generateClientSecret
} from "./helpers";
import { WEB_APP_DEFAULT_SCOPES } from "./constants";
import { ConflictRequestError, NotFoundError } from "@/common/exceptions";
import { ERROR_CODES } from "@/constants/error-code";
import { hashValue } from "@/utils/crypto/bcrypt";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

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

  async listUserApps(
    query: UserAppsQuery
  ): Promise<PaginatedResult<UserAppDto>> {
    const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const filter = buildWebAppFilter({
      search: query.search,
      status: "active"
    });

    const [docs, total] = await Promise.all([
      this.webAppRepo.findActivePaginated(filter, {
        skip: (page - 1) * limit,
        limit
      }),
      this.webAppRepo.countActive(filter)
    ]);

    return {
      items: docs.map(toUserAppDto),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  }

  async listCategories(): Promise<AdminCategoryDto[]> {
    const docs = await this.categoryRepo.findAll();
    return docs.map(toAdminCategoryDto);
  }

  async createApp(body: AdminAppCreateBody): Promise<AdminAppCreatedDto> {
    const nameTaken = await this.webAppRepo.existsByName(body.name);
    if (nameTaken) {
      throw new ConflictRequestError({
        i18nMessage: (t) => t("webApp:errors.nameExists"),
        code: ERROR_CODES.WEB_APP_NAME_EXISTS
      });
    }

    const categoryExists = await this.categoryRepo.existsById(body.categoryId);
    if (!categoryExists) {
      throw new NotFoundError({
        i18nMessage: (t) => t("webApp:errors.categoryNotFound"),
        code: ERROR_CODES.WEB_APP_CATEGORY_NOT_FOUND
      });
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();

    const doc = await this.webAppRepo.create({
      name: body.name,
      displayName: body.displayName,
      description: body.description?.trim() ? body.description.trim() : null,
      iconUrl: body.iconUrl?.trim() ? body.iconUrl.trim() : null,
      homeUrl: body.homeUrl,
      categoryId: body.categoryId,
      status: toInternalStatus(body.status),
      requiredRoles: body.requiredRoles,
      redirectUris: body.redirectUris,
      clientId,
      clientSecretHash: hashValue(clientSecret),
      scopes: [...WEB_APP_DEFAULT_SCOPES]
    });

    return toAdminAppCreatedDto(doc, clientSecret);
  }
}
