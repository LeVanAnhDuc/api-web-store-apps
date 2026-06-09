// types
import type {
  AdminAppsQuery,
  AdminAppCreateBody,
  AdminAppUpdateBody,
  WebAppUpdateInput
} from "./types";
import type {
  WebAppRepository,
  WebAppCategoryRepository
} from "./repositories";
import type { AdminAppDto, AdminCategoryDto, AdminAppCreatedDto } from "./dtos";
// dtos
import {
  toAdminAppDto,
  toAdminCategoryDto,
  toAdminAppCreatedDto
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

  async updateApp(id: string, body: AdminAppUpdateBody): Promise<AdminAppDto> {
    const existing = await this.webAppRepo.findById(id);
    if (!existing) {
      throw new NotFoundError({
        i18nMessage: (t) => t("webApp:errors.notFound"),
        code: ERROR_CODES.WEB_APP_NOT_FOUND
      });
    }

    if (body.name !== undefined && body.name !== existing.name) {
      const taken = await this.webAppRepo.existsByNameExcludingId(
        body.name,
        id
      );
      if (taken) {
        throw new ConflictRequestError({
          i18nMessage: (t) => t("webApp:errors.nameExists"),
          code: ERROR_CODES.WEB_APP_NAME_EXISTS
        });
      }
    }

    if (body.categoryId !== undefined) {
      const categoryExists = await this.categoryRepo.existsById(
        body.categoryId
      );
      if (!categoryExists) {
        throw new NotFoundError({
          i18nMessage: (t) => t("webApp:errors.categoryNotFound"),
          code: ERROR_CODES.WEB_APP_CATEGORY_NOT_FOUND
        });
      }
    }

    const updateInput: WebAppUpdateInput = {};
    if (body.name !== undefined) updateInput.name = body.name;
    if (body.displayName !== undefined)
      updateInput.displayName = body.displayName;
    if (body.description !== undefined)
      updateInput.description = body.description.trim()
        ? body.description.trim()
        : null;
    if (body.iconUrl !== undefined)
      updateInput.iconUrl = body.iconUrl.trim() ? body.iconUrl.trim() : null;
    if (body.homeUrl !== undefined) updateInput.homeUrl = body.homeUrl;
    if (body.categoryId !== undefined) updateInput.categoryId = body.categoryId;
    if (body.status !== undefined)
      updateInput.status = toInternalStatus(body.status);
    if (body.requiredRoles !== undefined)
      updateInput.requiredRoles = body.requiredRoles;
    if (body.redirectUris !== undefined)
      updateInput.redirectUris = body.redirectUris;

    const updated = await this.webAppRepo.updateById(id, updateInput);
    if (!updated) {
      throw new NotFoundError({
        i18nMessage: (t) => t("webApp:errors.notFound"),
        code: ERROR_CODES.WEB_APP_NOT_FOUND
      });
    }

    return toAdminAppDto(updated);
  }
}
