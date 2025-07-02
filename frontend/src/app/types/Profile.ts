export interface ProfileData {
    id: string; 
    username: string; 
    profile_picture: string; 
    tag?: string | null; 
    bio?: string | null; 
    point_x?: number | null; 
    point_y?: number | null; 
    point_z?: number | null; 
    created_at: string; 
  }