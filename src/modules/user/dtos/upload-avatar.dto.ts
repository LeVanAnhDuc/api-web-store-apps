export interface UploadAvatarDto {
  avatarUrl: string;
}

export const toUploadAvatarDto = (avatarUrl: string): UploadAvatarDto => ({
  avatarUrl
});
