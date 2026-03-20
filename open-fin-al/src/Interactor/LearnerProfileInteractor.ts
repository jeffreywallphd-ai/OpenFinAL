import { LearnerProfile } from '@domain/adaptive-learning';
import {
  buildLearnerProfileFromSurvey,
  createDefaultLearnerProfile,
  LearnerProfileSurveyInput,
  validateLearnerProfileSurveyInput,
} from '@application/adaptive-learning/learnerProfile';
import { ILearnerProfileStore } from '@application/services/ILearnerProfileStore';
import { ElectronLearnerProfileStore } from '@infrastructure/electron/ElectronLearnerProfileStore';

interface LearnerProfileInteractorDependencies {
  learnerProfileStore?: ILearnerProfileStore;
  now?: () => Date;
}

interface SaveLearnerProfileResult {
  success: boolean;
  profile?: LearnerProfile;
  errors?: string[];
}

export class LearnerProfileInteractor {
  private readonly learnerProfileStore: ILearnerProfileStore;
  private readonly now: () => Date;

  constructor({
    learnerProfileStore = new ElectronLearnerProfileStore(),
    now = () => new Date(),
  }: LearnerProfileInteractorDependencies = {}) {
    this.learnerProfileStore = learnerProfileStore;
    this.now = now;
  }

  async loadProfile(userId: number): Promise<LearnerProfile> {
    const profile = await this.learnerProfileStore.loadByUserId(userId);
    return profile ?? createDefaultLearnerProfile(`user-${userId}`);
  }

  async saveProfile(userId: number, input: LearnerProfileSurveyInput): Promise<SaveLearnerProfileResult> {
    const errors = validateLearnerProfileSurveyInput(input);

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    const existingProfile = await this.loadProfile(userId);
    const profile = buildLearnerProfileFromSurvey(`user-${userId}`, input, existingProfile, this.now().toISOString());
    await this.learnerProfileStore.saveByUserId(userId, profile);

    return {
      success: true,
      profile,
    };
  }
}
