export interface Vector2 {
    x: number;
    y: number;
}

export type ObstacleType = "wall" | "reset" | "hole";

export interface ObstacleConfig {
    id: string;
    type: ObstacleType;
    element: HTMLElement;
}

export interface ProximitySubscriber {
  id: string;
  element: HTMLElement;
  radius: number;
  onChange: (proximity: number) => void;
}