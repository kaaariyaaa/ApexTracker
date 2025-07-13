export interface PlatformData {
  val: number;
  totalMastersAndPreds: number;
}

export interface PredatorData {
  PC: PlatformData;
  PS4: PlatformData;
  X1: PlatformData;
}

export interface PlayerData {
  global: {
    name: string;
    platform: string;
    level: number;
    levelPrestige: number;
    rank: {
      rankName: string;
      rankDiv: number;
      rankScore: number;
      rankImg: string;
    };
  };
  total: {
    career_kills: {
      value: number;
    };
  };
  legends: {
    selected: {
      ImgAssets: {
        icon: string;
      };
    };
  };
  Error?: string;
}
