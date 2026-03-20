import { LearnerProfile } from '@domain/adaptive-learning';

export interface ILearnerProfileStore {
  loadByUserId(userId: number): Promise<LearnerProfile | null>;
  saveByUserId(userId: number, profile: LearnerProfile): Promise<LearnerProfile>;
}
