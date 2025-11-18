export type MpStatus =
  | 'scanning'
  | 'hand_found'
  | 'holding'
  | 'success'
  | 'no_hand'
  | 'low_light';

export interface MpStatusPayload {
  status: MpStatus;
  confidence?: number;
  holdProgress?: number;
}
