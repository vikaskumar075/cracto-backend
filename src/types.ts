import { ReleaseStatus } from "./constants";

export interface Release {
  id: string;
  name: string;
  date: string;
  status: ReleaseStatus;
  additionalInfo: string | null;
  stepsCompleted: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseInput {
  name: string;
  date: string;
  additionalInfo?: string;
}

export interface UpdateReleaseInput {
  id: string;
  additionalInfo?: string | null;
  stepsCompleted?: number[];
}
