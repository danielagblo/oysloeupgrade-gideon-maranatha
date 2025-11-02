import { AppDataSource } from "../config/database.js";
import { SystemSettings } from "../entities/SystemSettings.js";
import { NotFoundError } from "../utils/errors.js";

export interface PrivacyPolicyContent {
  title: string;
  content: string[];
  version: string;
}

export class AdminSettingsService {
  private get systemSettingsRepository() {
    return AppDataSource.getRepository(SystemSettings);
  }

  async getPrivacyPolicy() {
    const setting = await this.systemSettingsRepository.findOne({
      where: { key: "privacy_policy" },
      relations: ["updatedByAdmin"],
    });

    if (!setting) {
      // Return default if not found
      return {
        title: "Privacy Policy",
        content: ["Privacy policy content goes here..."],
        version: "1.0",
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      };
    }

    return {
      title: setting.value?.title || "Privacy Policy",
      content: setting.value?.content || [],
      version: setting.value?.version || "1.0",
      updatedAt: setting.updatedAt.toISOString(),
      updatedBy: setting.updatedByAdmin,
    };
  }

  async updatePrivacyPolicy(
    content: PrivacyPolicyContent,
    adminUserId: number
  ) {
    let setting = await this.systemSettingsRepository.findOne({
      where: { key: "privacy_policy" },
    });

    if (!setting) {
      setting = this.systemSettingsRepository.create({
        key: "privacy_policy",
        value: content,
        description: "Platform privacy policy",
        category: "legal",
        isPublic: true,
        updatedBy: adminUserId,
      });
    } else {
      setting.value = content;
      setting.updatedBy = adminUserId;
    }

    await this.systemSettingsRepository.save(setting);
    return setting;
  }

  async getTermsConditions() {
    const setting = await this.systemSettingsRepository.findOne({
      where: { key: "terms_conditions" },
      relations: ["updatedByAdmin"],
    });

    if (!setting) {
      return {
        title: "Terms & Conditions",
        content: ["Terms and conditions content goes here..."],
        version: "1.0",
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      };
    }

    return {
      title: setting.value?.title || "Terms & Conditions",
      content: setting.value?.content || [],
      version: setting.value?.version || "1.0",
      updatedAt: setting.updatedAt.toISOString(),
      updatedBy: setting.updatedByAdmin,
    };
  }

  async updateTermsConditions(
    content: PrivacyPolicyContent,
    adminUserId: number
  ) {
    let setting = await this.systemSettingsRepository.findOne({
      where: { key: "terms_conditions" },
    });

    if (!setting) {
      setting = this.systemSettingsRepository.create({
        key: "terms_conditions",
        value: content,
        description: "Platform terms and conditions",
        category: "legal",
        isPublic: true,
        updatedBy: adminUserId,
      });
    } else {
      setting.value = content;
      setting.updatedBy = adminUserId;
    }

    await this.systemSettingsRepository.save(setting);
    return setting;
  }
}


